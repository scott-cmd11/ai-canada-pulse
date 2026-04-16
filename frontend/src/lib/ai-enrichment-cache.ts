import { Redis } from '@upstash/redis'

export type DashboardEnrichmentKind = "canada"

export interface DashboardEnrichmentPayload {
    summaries: Record<string, string>
    executiveBrief: string[] | null
    generatedAt: string
}

interface DashboardEnrichmentBundle {
    canada: DashboardEnrichmentPayload | null
    generatedAt: string
}

const BUNDLE_KEY = "ai-dashboard-enrichment:v1"
const TTL_SECONDS = 86400 // 24 hours

const LOCK_KEY = "ai-dashboard-enrichment:lock"
const LOCK_TTL_SECONDS = 30 * 60 // 30 min cooldown between background refills

function getRedis(): Redis | null {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return null
    }
    return new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
}

export async function readDashboardEnrichment(
    kind: DashboardEnrichmentKind
): Promise<DashboardEnrichmentPayload | null> {
    const bundle = await readDashboardEnrichmentBundle()
    return bundle?.[kind] ?? null
}

export async function readDashboardEnrichmentBundle(): Promise<DashboardEnrichmentBundle | null> {
    const redis = getRedis()
    if (!redis) return null

    try {
        const data = await redis.get<DashboardEnrichmentBundle>(BUNDLE_KEY)
        return data ?? null
    } catch (err) {
        console.warn("[ai-enrichment-cache] Failed to read bundle:", err)
        return null
    }
}

/**
 * Acquire the enrichment lock via SET NX EX. Returns true if acquired, false
 * if another request already holds it (or Redis is unavailable). Used to
 * throttle on-demand background enrichment triggered from the stories route.
 */
export async function tryAcquireEnrichmentLock(): Promise<boolean> {
    const redis = getRedis()
    if (!redis) return false

    try {
        const result = await redis.set(LOCK_KEY, Date.now().toString(), {
            nx: true,
            ex: LOCK_TTL_SECONDS,
        })
        return result === "OK"
    } catch (err) {
        console.warn("[ai-enrichment-cache] Lock acquire failed:", err)
        return false
    }
}

export async function writeDashboardEnrichmentBundle(
    bundle: DashboardEnrichmentBundle
): Promise<void> {
    const redis = getRedis()
    if (!redis) {
        console.warn("[ai-enrichment-cache] No Upstash Redis configured, skipping write")
        return
    }

    try {
        await redis.set(BUNDLE_KEY, bundle, { ex: TTL_SECONDS })
    } catch (err) {
        console.warn("[ai-enrichment-cache] Failed to write bundle:", err)
        throw err
    }
}
