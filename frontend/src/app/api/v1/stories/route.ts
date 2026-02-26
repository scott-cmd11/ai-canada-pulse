import { NextResponse } from "next/server"
import { stories as fallbackStories, pulseScore as fallbackPulse } from "@/lib/mock-data"
import { fetchAllStories, derivePulseFromStories } from "@/lib/rss-client"

export async function GET() {
  try {
    const stories = await fetchAllStories(fallbackStories)
    const pulse = derivePulseFromStories(stories)

    return NextResponse.json(
      { stories, pulse },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=1500",
        },
      }
    )
  } catch {
    return NextResponse.json({
      stories: fallbackStories,
      pulse: fallbackPulse,
    })
  }
}
