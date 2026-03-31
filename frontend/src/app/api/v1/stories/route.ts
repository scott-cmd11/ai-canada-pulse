import { NextResponse } from "next/server"
import { fetchAllStories, derivePulseFromStories, filterStoriesByRegion } from "@/lib/rss-client"
import { hydrateCanadaStories } from "@/lib/dashboard-enrichment"
import { getProvinceBySlug } from "@/lib/provinces-config"
import { checkRateLimit } from "@/lib/rate-limit"
import { getSectionSummary } from "@/lib/section-summaries-client"

export const dynamic = "force-dynamic"
export const maxDuration = 30

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
