import { kv } from "@vercel/kv"

export type DashboardEnrichmentKind = "canada" | "global"

export interface DashboardEnrichmentPayload {
    summaries: Record<string, string>
    executiveBrief: string[] | null
    generatedAt: string
}

interface DashboardEnrichmentBundle {
    canada: DashboardEnrichmentPayload | null
    global: DashboardEnrichmentPayload | null
    generatedAt: string
}

const BUNDLE_KEY = "ai-dashboard-enrichment:v1"
const localBundleCache = new Map<string, DashboardEnrichmentBundle>()

function hasKvConfig(): boolean {
    return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
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

    localBundleCache.set(BUNDLE_KEY, bundle)
}
