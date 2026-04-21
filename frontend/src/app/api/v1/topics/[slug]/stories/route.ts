import { NextResponse } from "next/server"
import { fetchAllStories } from "@/lib/rss-client"
import { hydrateCanadaStories } from "@/lib/dashboard-enrichment"
import { getTopicBySlug } from "@/lib/topics"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * GET /api/v1/topics/[slug]/stories
 * Returns the enriched Canada story feed filtered to stories tagged with the
 * given topic slug. Used by the /topics/[slug] page's live feed.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> },
) {
    const limited = await checkRateLimit(request, "loose")
    if (limited) return limited

    const { slug } = await params
    const topic = getTopicBySlug(slug)
    if (!topic) {
        return NextResponse.json({ error: "Unknown topic" }, { status: 404 })
    }

    try {
        const rawStories = await fetchAllStories()
        const { stories, generatedAt } = await hydrateCanadaStories(rawStories)
        const filtered = stories.filter((s) => s.topics?.includes(slug))

        return NextResponse.json(
            { stories: filtered, topic: { slug: topic.slug, label: topic.label }, generatedAt },
            {
                headers: {
                    "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
                },
            },
        )
    } catch (err) {
        console.warn(`[api/topics/${slug}/stories] Failed:`, err)
        return NextResponse.json({ stories: [], topic: { slug: topic.slug, label: topic.label }, generatedAt: null })
    }
}
