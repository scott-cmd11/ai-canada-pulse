// frontend/src/app/api/v1/ai-refresh/status/route.ts
//
// Diagnostic endpoint for the AI enrichment pipeline. Protected by CRON_SECRET.
// Returns:
//   - bundle.generatedAt + age in hours
//   - bundle.summaryCount (how many stories in Redis have summaries)
//   - lock state + remaining TTL
//   - topStories: for the first 20 Canada stories currently in the feed, whether
//     each has a matching summary in the bundle. Exposes headline mismatches.
//
// Usage:
//   GET /api/v1/ai-refresh/status                        → read state
//   GET /api/v1/ai-refresh/status?clearLock=true         → force-release the lock
//
// Auth: Bearer <CRON_SECRET>

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import {
    readDashboardEnrichmentBundle,
    readEnrichmentLockStatus,
    clearEnrichmentLock,
} from '@/lib/ai-enrichment-cache'
import { fetchAllStories, CANADA_DASHBOARD_STORY_LIMIT } from '@/lib/rss-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function authorize(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return false
    const token = authHeader.slice(7)
    const secret = process.env.CRON_SECRET
    if (!secret) return false
    try {
        return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
    } catch {
        return false
    }
}

function headlineKey(headline: string): string {
    return headline.trim().toLowerCase().replace(/\s+/g, ' ')
}

export async function GET(request: NextRequest) {
    if (!authorize(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow force-clearing the lock via ?clearLock=true
    if (request.nextUrl.searchParams.get('clearLock') === 'true') {
        const cleared = await clearEnrichmentLock()
        return NextResponse.json({ lockCleared: cleared })
    }

    const [bundle, lock, stories] = await Promise.all([
        readDashboardEnrichmentBundle(),
        readEnrichmentLockStatus(),
        fetchAllStories().catch(() => [] as Awaited<ReturnType<typeof fetchAllStories>>),
    ])

    const canada = bundle?.canada ?? null
    const summaries = canada?.summaries ?? {}
    const summaryKeys = new Set(Object.keys(summaries).map((k) => headlineKey(k)))

    const top = stories.slice(0, Math.min(20, CANADA_DASHBOARD_STORY_LIMIT))
    const topStories = top.map((s) => ({
        headline: s.headline,
        publishedAt: s.publishedAt,
        hasSummary: summaryKeys.has(headlineKey(s.headline)),
    }))

    const withSummary = topStories.filter((s) => s.hasSummary).length
    const generatedAt = canada?.generatedAt ?? null
    const ageHours = generatedAt
        ? Math.round(((Date.now() - new Date(generatedAt).getTime()) / 3_600_000) * 10) / 10
        : null

    return NextResponse.json({
        bundle: {
            exists: !!canada,
            generatedAt,
            ageHours,
            summaryCount: Object.keys(summaries).length,
            briefCount: canada?.executiveBrief?.length ?? 0,
        },
        lock,
        feed: {
            totalStories: stories.length,
            topWindow: topStories.length,
            topWithSummary: withSummary,
            topMissingSummary: topStories.length - withSummary,
            topStories,
        },
        env: {
            hasRedis: !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN,
            hasOpenAI: !!process.env.OPENAI_API_KEY,
            hasCronSecret: !!process.env.CRON_SECRET,
            vercelUrl: process.env.VERCEL_URL ?? null,
        },
    })
}
