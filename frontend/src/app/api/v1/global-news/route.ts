import { NextResponse } from "next/server"
import { fetchGlobalAINews } from "@/lib/global-client"
import { hydrateGlobalStories } from "@/lib/dashboard-enrichment"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET() {
    try {
        const stories = await fetchGlobalAINews()
        const { stories: enrichedStories, executiveBrief } = await hydrateGlobalStories(stories)

        return NextResponse.json(
            { stories: enrichedStories, executiveBrief },
            { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
        )
    } catch (err) {
        console.warn("[api/global-news] Failed:", err)
        return NextResponse.json({ stories: [], executiveBrief: null })
    }
}
