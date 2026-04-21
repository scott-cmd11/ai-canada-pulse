import { NextResponse } from "next/server"
import { TOPICS, TOPIC_CATEGORIES } from "@/lib/topics"
import { readDashboardEnrichment } from "@/lib/ai-enrichment-cache"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * GET /api/v1/topics
 * Returns the full topic catalog plus per-topic story counts derived from the
 * current enrichment bundle. Story counts are a leading indicator of which
 * topics are getting coverage this cycle — used by the /topics index page.
 */
export async function GET(request: Request) {
    const limited = await checkRateLimit(request, "loose")
    if (limited) return limited

    try {
        const payload = await readDashboardEnrichment("canada")
        const counts = new Map<string, number>()
        if (payload?.topics) {
            for (const tags of Object.values(payload.topics)) {
                for (const slug of tags) {
                    counts.set(slug, (counts.get(slug) ?? 0) + 1)
                }
            }
        }

        const topics = TOPICS.map((t) => ({
            slug: t.slug,
            label: t.label,
            category: t.category,
            shortDescription: t.shortDescription,
            storyCount: counts.get(t.slug) ?? 0,
        }))

        return NextResponse.json(
            {
                categories: TOPIC_CATEGORIES,
                topics,
                generatedAt: payload?.generatedAt ?? null,
            },
            {
                headers: {
                    "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
                },
            },
        )
    } catch (err) {
        console.warn("[api/topics] Failed:", err)
        // Catalog-only fallback: the topic list is static, so even with Redis down
        // the index page should still render — just with zero counts everywhere.
        return NextResponse.json({
            categories: TOPIC_CATEGORIES,
            topics: TOPICS.map((t) => ({
                slug: t.slug,
                label: t.label,
                category: t.category,
                shortDescription: t.shortDescription,
                storyCount: 0,
            })),
            generatedAt: null,
        })
    }
}
