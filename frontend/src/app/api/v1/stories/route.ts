import { NextResponse } from "next/server"
import { fetchAllStories, derivePulseFromStories, filterStoriesByRegion } from "@/lib/rss-client"
import { hydrateCanadaStories } from "@/lib/dashboard-enrichment"
import { getProvinceBySlug } from "@/lib/provinces-config"
import { checkRateLimit } from "@/lib/rate-limit"
import { getSectionSummary } from "@/lib/section-summaries-client"
import { tryAcquireEnrichmentLock } from "@/lib/ai-enrichment-cache"
import type { Story } from "@/lib/mock-data"

export const dynamic = "force-dynamic"
export const maxDuration = 30

// How many top stories to scan for missing summaries before triggering
// a background refill. The feed shows ~10 items initially, so this is enough
// to cover the above-the-fold experience.
const SUMMARY_COVERAGE_WINDOW = 10

/**
 * Fire-and-forget: if the top Canada stories are missing AI summaries, kick
 * off the same enrichment the cron runs. Throttled via a 30-min Redis lock so
 * we don't stampede OpenAI on every request. Replaces the 30-min cron that was
 * removed in 7411773 (incompatible with Hobby plan's 2-cron cap).
 */
async function triggerBackgroundEnrichmentIfStale(stories: Story[], requestUrl: string) {
    const missing = stories
        .slice(0, SUMMARY_COVERAGE_WINDOW)
        .some((s) => !s.aiSummary)
    if (!missing) return

    const acquired = await tryAcquireEnrichmentLock()
    if (!acquired) return

    const secret = process.env.CRON_SECRET
    if (!secret) return

    const origin = new URL(requestUrl).origin
    // Fire without awaiting the response — the receiving function runs with its
    // own 300s budget and will complete independently. We `void` the promise so
    // the calling handler can return immediately.
    void fetch(`${origin}/api/v1/ai-refresh?light=true`, {
        headers: { Authorization: `Bearer ${secret}` },
    }).catch((err) => {
        console.warn("[api/stories] Background enrichment trigger failed:", err)
    })
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

    return NextResponse.json(
      { stories: enrichedStories, pulse, executiveBrief, summary },
      {
        headers: {
          "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
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
