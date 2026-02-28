import { NextResponse } from "next/server"
import { fetchAllStories, derivePulseFromStories } from "@/lib/rss-client"

export async function GET() {
  try {
    const stories = await fetchAllStories()
    const pulse = derivePulseFromStories(stories)

    return NextResponse.json(
      { stories, pulse },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=1500",
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
    })
  }
}
