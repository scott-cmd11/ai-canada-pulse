import { NextResponse } from "next/server"
import { fetchAllStories, derivePulseFromStories } from "@/lib/rss-client"
import { hydrateCanadaStories } from "@/lib/dashboard-enrichment"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET() {
  try {
    const stories = await fetchAllStories()
    const pulse = derivePulseFromStories(stories)
    const { stories: enrichedStories, executiveBrief } = await hydrateCanadaStories(stories)

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
