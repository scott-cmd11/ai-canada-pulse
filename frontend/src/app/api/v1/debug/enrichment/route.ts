/**
 * Debug endpoint — introspect the AI enrichment cache state.
 *
 * GET  /api/v1/debug/enrichment        → bundle metadata (summary/topic counts,
 *                                         age, env var presence). Gated by CRON_SECRET.
 * DELETE /api/v1/debug/enrichment?lock → force-release the enrichment lock.
 *
 * No bundle contents are returned (just counts / shapes) so this is safe to
 * expose behind the cron secret — authors can sanity-check without leaking
 * story data.
 */
import { NextResponse } from "next/server"
import {
    readDashboardEnrichmentBundle,
    readEnrichmentLockStatus,
    clearEnrichmentLock,
} from "@/lib/ai-enrichment-cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAuthorized(request: Request): boolean {
    const expected = process.env.CRON_SECRET
    if (!expected) return false
    const auth = request.headers.get("authorization")
    return auth === `Bearer ${expected}`
}

export async function GET(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const bundle = await readDashboardEnrichmentBundle()
    const canada = bundle?.canada ?? null
    const summaries = canada?.summaries ?? {}
    const topics = canada?.topics ?? {}

    const summaryCount = Object.keys(summaries).length
    const topicsCount = Object.keys(topics).length
    const storiesWithAtLeastOneTopic = Object.values(topics).filter(
        (tags) => Array.isArray(tags) && tags.length > 0,
    ).length

    const generatedAt = canada?.generatedAt ?? bundle?.generatedAt ?? null
    const ageHours = generatedAt
        ? (Date.now() - new Date(generatedAt).getTime()) / 3_600_000
        : null

    // Count tag distribution across topic slugs (only non-empty counts)
    const tagDistribution: Record<string, number> = {}
    for (const tags of Object.values(topics)) {
        if (!Array.isArray(tags)) continue
        for (const slug of tags) {
            tagDistribution[slug] = (tagDistribution[slug] ?? 0) + 1
        }
    }

    const lock = await readEnrichmentLockStatus()

    return NextResponse.json({
        bundleExists: !!bundle,
        canadaExists: !!canada,
        summaryCount,
        topicsCount,
        storiesWithAtLeastOneTopic,
        tagDistribution,
        briefLength: Array.isArray(canada?.executiveBrief) ? canada.executiveBrief.length : 0,
        generatedAt,
        ageHours: ageHours !== null ? Number(ageHours.toFixed(2)) : null,
        lock,
        env: {
            hasOpenAIKey: !!process.env.OPENAI_API_KEY,
            hasUpstashRedis:
                !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN,
            hasCronSecret: !!process.env.CRON_SECRET,
            articleModel: process.env.OPENAI_ARTICLE_MODEL ?? "gpt-4o-mini (default)",
            taggerModel: process.env.OPENAI_TAGGER_MODEL ?? "gpt-5-nano (default)",
        },
    })
}

export async function DELETE(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const target = url.searchParams.get("target") ?? "lock"

    if (target === "lock") {
        const cleared = await clearEnrichmentLock()
        return NextResponse.json({ cleared, target: "lock" })
    }

    return NextResponse.json({ error: `unknown target: ${target}` }, { status: 400 })
}
