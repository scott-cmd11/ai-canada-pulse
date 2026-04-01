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
