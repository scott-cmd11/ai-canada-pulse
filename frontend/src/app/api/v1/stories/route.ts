import { NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { fetchAllStories, derivePulseFromStories, filterStoriesByRegion, CANADA_DASHBOARD_STORY_LIMIT } from "@/lib/rss-client"
import { hydrateCanadaStories } from "@/lib/dashboard-enrichment"
import { getProvinceBySlug } from "@/lib/provinces-config"
import { checkRateLimit } from "@/lib/rate-limit"
import { getSectionSummary } from "@/lib/section-summaries-client"
import { tryAcquireEnrichmentLock } from "@/lib/ai-enrichment-cache"
import type { Story } from "@/lib/mock-data"

export const dynamic = "force-dynamic"
export const maxDuration = 30

// Scan the full enrichment window (50 stories) for missing summaries. Anything
// within CANADA_DASHBOARD_STORY_LIMIT is eligible for enrichment, so a gap
// anywhere in that range is a valid reason to trigger the self-heal. The lock
// throttles the trigger itself to once per 30 min.
const SUMMARY_COVERAGE_WINDOW = CANADA_DASHBOARD_STORY_LIMIT

/**
 * Resolve the origin to use for the self-call. `request.url` works on Vercel
 * but falls back to VERCEL_URL for defence-in-depth against proxy rewrites.
 */
function resolveOrigin(requestUrl: string): string | null {
    try {
        const url = new URL(requestUrl)
        if (url.origin && !url.origin.includes("localhost")) return url.origin
    } catch {}
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return null
}

/**
 * If the top Canada stories are missing AI summaries, kick off the same
 * enrichment the cron runs. Throttled via a 30-min Redis lock so we don't
 * stampede OpenAI on every request. Uses Vercel's waitUntil so the outbound
 * fetch actually survives the stories response. Replaces the 30-min cron
 * that was removed in 7411773 (incompatible with Hobby's 2-cron cap).
 */
async function triggerBackgroundEnrichmentIfStale(stories: Story[], requestUrl: string) {
    const missing = stories
        .slice(0, SUMMARY_COVERAGE_WINDOW)
        .filter((s) => !s.aiSummary)
    if (missing.length === 0) return

    const acquired = await tryAcquireEnrichmentLock()
    if (!acquired) {
        console.log(`[api/stories] ${missing.length} stories missing summaries; lock held, skipping`)
        return
    }

    const secret = process.env.CRON_SECRET
    if (!secret) {
        console.warn("[api/stories] No CRON_SECRET; cannot self-trigger enrichment")
        return
    }

    const origin = resolveOrigin(requestUrl)
    if (!origin) {
        console.warn("[api/stories] Cannot resolve origin for self-call")
        return
    }

    console.log(`[api/stories] ${missing.length} stories missing summaries; triggering ${origin}/api/v1/ai-refresh?light=true`)

    // waitUntil extends the function's lifetime for the outbound request so
    // Vercel doesn't freeze us before the TCP bytes flush. The receiving
    // function then runs with its own 300s budget.
    waitUntil(
        fetch(`${origin}/api/v1/ai-refresh?light=true`, {
            headers: { Authorization: `Bearer ${secret}` },
        })
            .then((res) => console.log(`[api/stories] Enrichment trigger responded ${res.status}`))
            .catch((err) => console.warn("[api/stories] Enrichment trigger failed:", err))
    )
}

export async function GET(request: Request) {
  const limited = await checkRateLimit(request, 'loose')
  if (limited) return limited
  const { searchParams } = new URL(request.url)
  const regionSlug = searchParams.get('region')
  const regionName = regionSlug ? (getProvinceBySlug(regionSlug)?.name ?? regionSlug) : null

  try {
    const stories = await fetchAllStories()
    const filteredStories = regionName ? filterStoriesByRegion(stories, regionName) : stories
    const pulse = derivePulseFromStories(filteredStories)
    const { stories: enrichedStories, executiveBrief } = await hydrateCanadaStories(filteredStories)

    // Only self-heal the main Canada feed — the enrichment bundle is keyed on
    // the national story set, not per-region.
    if (!regionName) {
        await triggerBackgroundEnrichmentIfStale(enrichedStories, request.url)
    }

    const summary = await getSectionSummary('stories')

    // If the top window still has stories without AI summaries, the self-heal
    // above has likely just been triggered. Use a very short cache so the
    // pre-enrichment response doesn't get pinned into the CDN for 10 min after
    // the bundle catches up. Once fully hydrated, cache normally.
    const topMissing = enrichedStories
      .slice(0, SUMMARY_COVERAGE_WINDOW)
      .filter((s) => !s.aiSummary).length
    const cacheControl = topMissing > 0
      ? "public, max-age=30, stale-while-revalidate=60"
      : "public, max-age=600, stale-while-revalidate=1800"

    return NextResponse.json(
      { stories: enrichedStories, pulse, executiveBrief, summary },
      {
        headers: {
          "Cache-Control": cacheControl,
        },
      }
    )
  } catch (err) {
    console.warn("[api/stories] Failed:", err)
    return NextResponse.json({
      stories: [],
      pulse: {
        mood: "amber",
        moodLabel: "Awaiting data",
        description: "Unable to fetch stories at this time.",
        updatedAt: new Date().toISOString(),
      },
      executiveBrief: null,
      summary: null,
    })
  }
}
