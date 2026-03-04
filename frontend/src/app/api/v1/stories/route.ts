import { NextResponse } from "next/server"
import { fetchAllStories, derivePulseFromStories } from "@/lib/rss-client"
import { summarizeArticles, generateExecutiveBrief } from "@/lib/summarizer"

export const dynamic = "force-dynamic"
export const maxDuration = 30 // Allow 30s for AI enrichment

export async function GET() {
  try {
    const stories = await fetchAllStories()
    const pulse = derivePulseFromStories(stories)

    // Attempt AI enrichment (non-blocking — falls back gracefully)
    let executiveBrief: string[] | null = null

    try {
      console.log(`[api/stories] AI enrichment starting. HF_API_TOKEN set: ${!!process.env.HF_API_TOKEN}, stories count: ${stories.length}`)

      // Only summarize top 10 articles to stay within function time limits
      const top = stories.slice(0, 10)
      const articlesForAI = top.map((s) => ({
        headline: s.headline,
        snippet: s.summary,
        category: s.category,
        source: s.sourceName || "Unknown",
      }))

      // Also pass all articles for the executive brief
      const allArticlesForBrief = stories.map((s) => ({
        headline: s.headline,
        snippet: s.summary,
        category: s.category,
        source: s.sourceName || "Unknown",
      }))

      const [summaryMap, brief] = await Promise.all([
        summarizeArticles(articlesForAI),
        generateExecutiveBrief(allArticlesForBrief),
      ])

      console.log(`[api/stories] AI results — summaryMap: ${summaryMap ? summaryMap.size + ' entries' : 'null'}, brief: ${brief ? brief.length + ' bullets' : 'null'}`)

      // Attach AI summaries to stories
      if (summaryMap) {
        let attached = 0
        for (const story of stories) {
          const aiSummary = summaryMap.get(story.headline)
          if (aiSummary) {
            story.aiSummary = aiSummary
            attached++
          }
        }
        console.log(`[api/stories] Attached ${attached}/${stories.length} AI summaries (map has ${summaryMap.size} keys)`)
      } else {
        console.log(`[api/stories] summaryMap was null — no per-article summaries generated`)
      }

      executiveBrief = brief
    } catch (aiErr) {
      console.warn("[api/stories] AI enrichment failed (non-fatal):", aiErr)
    }

    return NextResponse.json(
      { stories, pulse, executiveBrief },
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
