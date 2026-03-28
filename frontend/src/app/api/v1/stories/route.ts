import { NextResponse } from "next/server"
import { fetchAllStories, derivePulseFromStories, filterStoriesByRegion } from "@/lib/rss-client"
import { hydrateCanadaStories } from "@/lib/dashboard-enrichment"
import { getProvinceBySlug } from "@/lib/provinces-config"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionSlug = searchParams.get('region')
  const regionName = regionSlug ? (getProvinceBySlug(regionSlug)?.name ?? regionSlug) : null

  try {
    const stories = await fetchAllStories()
    const filteredStories = regionName ? filterStoriesByRegion(stories, regionName) : stories
    const pulse = derivePulseFromStories(filteredStories)
    const { stories: enrichedStories, executiveBrief } = await hydrateCanadaStories(filteredStories)

    return NextResponse.json(
      { stories: enrichedStories, pulse, executiveBrief },
      {
        headers: {
          "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
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
    })
  }
}
