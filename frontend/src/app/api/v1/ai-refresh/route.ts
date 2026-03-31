// frontend/src/app/api/v1/ai-refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { refreshDashboardEnrichmentBundle } from '@/lib/dashboard-enrichment'
import { fetchAllStories } from '@/lib/rss-client'
import { generateDigest, saveDigest, saveDigestError, getDigest } from '@/lib/digest-client'
import { detectAndGenerateDeepDive, forceGenerateDeepDive } from '@/lib/deep-dive-client'

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
  const seed = request.nextUrl.searchParams.get('seed') === 'true'
  try {
    const generate = seed ? forceGenerateDeepDive : detectAndGenerateDeepDive
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
    results.deepDive = slug ? `generated: ${slug}` : 'no threshold crossed'

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

  return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), ...results })
}
