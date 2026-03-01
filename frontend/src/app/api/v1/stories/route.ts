import { NextResponse } from "next/server"
import { fetchAllStories, derivePulseFromStories } from "@/lib/rss-client"
import { summarizeArticles, generateExecutiveBrief } from "@/lib/summarizer"

export async function GET() {
  try {
    const stories = await fetchAllStories()
    const pulse = derivePulseFromStories(stories)

    // Attempt AI enrichment (non-blocking — falls back gracefully)
    let executiveBrief: string[] | null = null

    try {
      // Per-article summaries
      const articlesForAI = stories.map((s) => ({
        headline: s.headline,
        snippet: s.summary,
        category: s.category,
        source: s.sourceName || "Unknown",
      }))

      const [summaryMap, brief] = await Promise.all([
        summarizeArticles(articlesForAI),
        generateExecutiveBrief(articlesForAI),
      ])

      // Attach AI summaries to stories
      if (summaryMap) {
        for (const story of stories) {
          const aiSummary = summaryMap.get(story.headline)
          if (aiSummary) {
            story.aiSummary = aiSummary
          }
        }
      }

      executiveBrief = brief
    } catch (aiErr) {
      console.warn("[api/stories] AI enrichment failed (non-fatal):", aiErr)
    }

    return NextResponse.json(
      { stories, pulse, executiveBrief },
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
      executiveBrief: null,
    })
  }
}
