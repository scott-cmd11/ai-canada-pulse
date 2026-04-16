import { NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
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
