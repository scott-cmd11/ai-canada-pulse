import { NextResponse } from "next/server"
import { fetchGlobalAINews } from "@/lib/global-client"
import { summarizeGlobalArticles, generateGlobalBrief } from "@/lib/summarizer"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET() {
    try {
        const stories = await fetchGlobalAINews()

        // Attempt AI enrichment (non-blocking — falls back gracefully)
        let executiveBrief: string[] | null = null

        try {
            const top = stories.slice(0, 10)
            const articlesForAI = top.map((s) => ({
                headline: s.headline,
                snippet: s.summary,
                category: s.region,
                source: s.sourceName,
            }))

            // Generate per-article summaries
            const summaryMap = await summarizeGlobalArticles(articlesForAI)
            if (summaryMap) {
                for (const story of stories) {
                    const aiSummary = summaryMap.get(story.headline)
                    if (aiSummary) {
                        story.aiSummary = aiSummary
                    }
                }
            }

            // Generate executive brief from all stories
            const allArticles = stories.map((s) => ({
                headline: s.headline,
                snippet: s.summary,
                category: s.region,
                source: s.sourceName,
            }))
            executiveBrief = await generateGlobalBrief(allArticles)
        } catch (aiErr) {
            console.warn("[api/global-news] AI enrichment failed (non-fatal):", aiErr)
        }

        return NextResponse.json(
            { stories, executiveBrief },
            { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
        )
    } catch (err) {
        console.warn("[api/global-news] Failed:", err)
        return NextResponse.json({ stories: [], executiveBrief: null })
    }
}
