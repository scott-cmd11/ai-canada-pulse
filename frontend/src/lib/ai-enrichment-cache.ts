import { kv } from "@vercel/kv"
import { createClient } from "redis"

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
const localBundleCache = new Map<string, DashboardEnrichmentBundle>()

let redisClient: ReturnType<typeof createClient> | null = null
let redisClientPromise: Promise<ReturnType<typeof createClient> | null> | null = null

function hasKvConfig(): boolean {
    return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

function hasRedisUrlConfig(): boolean {
    return Boolean(process.env.REDIS_URL)
}

async function getRedisClient(): Promise<ReturnType<typeof createClient> | null> {
    if (!hasRedisUrlConfig()) return null

    if (redisClient?.isOpen) return redisClient
    if (redisClientPromise) return redisClientPromise

    redisClientPromise = (async () => {
        try {
            const client = createClient({ url: process.env.REDIS_URL })
            client.on("error", (err) => {
                console.warn("[ai-enrichment-cache] Redis client error:", err)
            })
            await client.connect()
            redisClient = client
            return client
        } catch (err) {
            console.warn("[ai-enrichment-cache] Failed to initialize REDIS_URL client:", err)
            return null
        } finally {
            redisClientPromise = null
        }
    })()

    return redisClientPromise
}

export async function readDashboardEnrichment(
    kind: DashboardEnrichmentKind
): Promise<DashboardEnrichmentPayload | null> {
    const bundle = await readDashboardEnrichmentBundle()
    return bundle?.[kind] ?? null
}

export async function readDashboardEnrichmentBundle(): Promise<DashboardEnrichmentBundle | null> {
    if (hasKvConfig()) {
        try {
            const bundle = await kv.get<DashboardEnrichmentBundle>(BUNDLE_KEY)
            if (bundle) return bundle
        } catch (err) {
            console.warn("[ai-enrichment-cache] Failed to read Vercel KV bundle:", err)
        }
    }

    const redis = await getRedisClient()
    if (redis) {
        try {
            const raw = await redis.get(BUNDLE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw) as DashboardEnrichmentBundle
                return parsed
            }
        } catch (err) {
            console.warn("[ai-enrichment-cache] Failed to read REDIS_URL bundle:", err)
        }
    }

    return localBundleCache.get(BUNDLE_KEY) ?? null
}

export async function writeDashboardEnrichmentBundle(
    bundle: DashboardEnrichmentBundle
): Promise<void> {
    if (hasKvConfig()) {
        try {
            await kv.set(BUNDLE_KEY, bundle)
        } catch (err) {
            console.warn("[ai-enrichment-cache] Failed to write Vercel KV bundle:", err)
            throw err
        }
    }

    const redis = await getRedisClient()
    if (redis) {
        try {
            await redis.set(BUNDLE_KEY, JSON.stringify(bundle))
        } catch (err) {
            console.warn("[ai-enrichment-cache] Failed to write REDIS_URL bundle:", err)
            throw err
        }
    }

    localBundleCache.set(BUNDLE_KEY, bundle)
}
