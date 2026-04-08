// frontend/src/app/api/v1/ai-refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { refreshDashboardEnrichmentBundle } from '@/lib/dashboard-enrichment'
import { fetchAllStories } from '@/lib/rss-client'
import { generateDigest, saveDigest, saveDigestError, getDigest } from '@/lib/digest-client'
import { detectAndGenerateDeepDive, forceGenerateDeepDive, listDeepDives } from '@/lib/deep-dive-client'
import { generateAndSaveSectionSummaries } from '@/lib/section-summaries-client'
import { refreshJobBankStats } from '@/lib/jobs-client'
import { compileWeeklyDigest } from '@/lib/weekly-digest'
import { sendWeeklyDigestBatch } from '@/lib/email'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // bumped from 60 to accommodate digest + deep-dive generation

function authorize(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const results: Record<string, unknown> = { date: today }

  // Light mode: only run enrichment. Used by the 30-min stories cron so new
  // stories get AI summaries without running the full heavy pipeline.
  const lightMode = request.nextUrl.searchParams.get('light') === 'true'

  // Step 1: Existing dashboard enrichment (summaries + executive brief)
  try {
    const enrichment = await refreshDashboardEnrichmentBundle()
    results.enrichment = {
      summaryCount: Object.keys(enrichment.canada?.summaries ?? {}).length,
      briefCount: enrichment.canada?.executiveBrief?.length ?? 0,
    }
  } catch (err) {
    console.error('[ai-refresh] Dashboard enrichment failed:', err)
    results.enrichmentError = true
  }

  if (lightMode) {
    return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), mode: 'light', ...results })
  }

  // Step 2: Fetch stories for digest and deep-dive generation
  let stories: Awaited<ReturnType<typeof fetchAllStories>> = []
  try {
    stories = await fetchAllStories()
  } catch (err) {
    console.error('[ai-refresh] Story fetch failed:', err)
  }

  // Step 3: Generate daily digest
  try {
    const digest = await generateDigest(
      stories.map((s) => ({
        headline: s.headline,
        summary: s.summary ?? '',
        sourceName: s.sourceName ?? '',
        sourceUrl: s.sourceUrl ?? '',
        category: s.category,
      })),
      today
    )
    if (digest) {
      await saveDigest(digest)
      results.digest = 'generated'
    } else {
      await saveDigestError(today)
      results.digest = 'error'
    }
  } catch (err) {
    console.error('[ai-refresh] Digest generation failed:', err)
    await saveDigestError(today)
    results.digest = 'error'
  }

  // Step 4: Check significance + conditionally generate deep-dive
  // Auto-seed: if the blog has no posts yet, force-generate regardless of threshold.
  // This means the blog is never empty after the first cron run.
  const manualSeed = request.nextUrl.searchParams.get('seed') === 'true'
  const recentPosts = await listDeepDives(1, 0).catch(() => [] as Awaited<ReturnType<typeof listDeepDives>>)
  const lastPostDate = recentPosts[0]?.date ? new Date(recentPosts[0].date) : null
  const daysSinceLastPost = lastPostDate ? (Date.now() - lastPostDate.getTime()) / 86_400_000 : Infinity
  const shouldSeed = manualSeed || recentPosts.length === 0 || daysSinceLastPost >= 7
  try {
    const generate = shouldSeed ? forceGenerateDeepDive : detectAndGenerateDeepDive
    const slug = await generate(
      stories.map((s) => ({
        headline: s.headline,
        summary: s.summary ?? '',
        sourceName: s.sourceName ?? '',
        sourceUrl: s.sourceUrl ?? '',
        category: s.category,
      })),
      today
    )
    results.deepDive = slug
      ? `generated: ${slug}`
      : shouldSeed ? 'seed attempted but failed' : 'no threshold crossed'

    // Write the deep-dive slug back to today's digest so the homepage callout renders
    if (slug && results.digest === 'generated') {
      try {
        const existingDigest = await getDigest(today)
        if (existingDigest && !existingDigest.error) {
          await saveDigest({ ...existingDigest, deepDiveSlug: slug })
          results.deepDiveLinked = true
        }
      } catch (err) {
        console.error('[ai-refresh] Failed to update digest with deepDiveSlug:', err)
      }
    }
  } catch (err) {
    console.error('[ai-refresh] Deep-dive generation failed:', err)
    results.deepDive = 'error'
  }

  // Step 5: Refresh Job Bank CSV stats (39MB CSV — only feasible in the cron's 300s window)
  try {
    const jobStats = await refreshJobBankStats()
    results.jobBank = jobStats ? `cached: ${jobStats.totalAIJobs} vacancies (${jobStats.dataMonth})` : 'failed'
  } catch (err) {
    console.error('[ai-refresh] Job Bank refresh failed:', err)
    results.jobBank = 'error'
  }

  // Step 6: Generate section summaries for all 6 signal domains
  try {
    const summaries = await generateAndSaveSectionSummaries(
      stories.map((s) => ({
        headline: s.headline,
        summary: s.summary ?? '',
        category: s.category,
        region: s.region ?? 'Canada',
      })),
      today
    )
    results.sectionSummaries = summaries ? 'generated' : 'skipped'
  } catch (err) {
    console.error('[ai-refresh] Section summaries failed:', err)
    results.sectionSummaries = 'error'
  }

  // Step 7: Weekly email — on Mondays, compile and send the weekly digest
  const dayOfWeek = new Date().getUTCDay() // 0 = Sunday, 1 = Monday
  const forceWeekly = request.nextUrl.searchParams.get('weekly') === 'true'
  if (dayOfWeek === 1 || forceWeekly) {
    try {
      const weeklyData = await compileWeeklyDigest()
      if (weeklyData) {
        const supabase = getSupabase()
        if (supabase) {
          const { data: subscribers } = await supabase
            .from('subscribers')
            .select('email, unsubscribe_token')
            .eq('status', 'confirmed')

          if (subscribers && subscribers.length > 0) {
            const emailResults = await sendWeeklyDigestBatch(
              subscribers.map(s => ({
                email: s.email,
                unsubscribeToken: s.unsubscribe_token,
              })),
              weeklyData
            )
            results.weeklyEmail = `sent: ${emailResults.sent}, failed: ${emailResults.failed} (${subscribers.length} subscribers)`
          } else {
            results.weeklyEmail = 'no confirmed subscribers'
          }
        } else {
          results.weeklyEmail = 'skipped (no Supabase)'
        }
      } else {
        results.weeklyEmail = 'skipped (no digest data)'
      }
    } catch (err) {
      console.error('[ai-refresh] Weekly email failed:', err)
      results.weeklyEmail = 'error'
    }
  }

  return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), ...results })
}
