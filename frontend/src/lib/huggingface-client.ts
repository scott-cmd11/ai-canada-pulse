/**
 * Hugging Face Hub API Client
 * Tracks Canadian AI organization models and downloads.
 * Uses both org `author=` and `search=` queries for coverage.
 */

const HF_BASE = "https://huggingface.co/api"
const TIMEOUT_MS = 15_000

const CANADIAN_ORGS = [
    { slug: "Cohere", name: "Cohere", search: false },
    { slug: "CohereForAI", name: "Cohere for AI", search: true },
    { slug: "mila-iqia", name: "Mila", search: true },
    { slug: "VectorInstitute", name: "Vector Institute", search: true },
]

export interface HFOrgStats {
    orgName: string
    orgSlug: string
    modelCount: number
    totalDownloads: number
    topModels: { id: string; downloads: number; pipeline: string }[]
}

export interface HuggingFaceData {
    orgs: HFOrgStats[]
    totalModels: number
    totalDownloads: number
    fetchedAt: string
}

interface HFModel {
    id?: string
    downloads?: number
    pipeline_tag?: string
}

async function fetchOrgModels(slug: string, name: string, useSearch: boolean): Promise<HFOrgStats> {
    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        // Try author= first (exact org match), fall back to search=
        const queryParam = useSearch ? `search=${slug}` : `author=${slug}`
        const res = await fetch(`${HF_BASE}/models?${queryParam}&limit=100&sort=downloads&direction=-1`, {
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
        })
        clearTimeout(timer)

        if (!res.ok) {
            console.warn(`[hf-client] Error fetching ${slug}: ${res.status}`)
            return { orgName: name, orgSlug: slug, modelCount: 0, totalDownloads: 0, topModels: [] }
        }

        let models: HFModel[] = await res.json()

        // For search results, filter to only models by the org (id starts with slug/)
        if (useSearch) {
            models = models.filter((m) => m.id?.startsWith(`${slug}/`))
        }

        const totalDownloads = models.reduce((sum, m) => sum + (m.downloads || 0), 0)
        const sorted = [...models].sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        const topModels = sorted.slice(0, 3).map((m) => ({
            id: m.id || "unknown",
            downloads: m.downloads || 0,
            pipeline: m.pipeline_tag || "unknown",
        }))

        return { orgName: name, orgSlug: slug, modelCount: models.length, totalDownloads, topModels }
    } catch (err) {
        console.warn(`[hf-client] Failed for ${slug}:`, err)
        return { orgName: name, orgSlug: slug, modelCount: 0, totalDownloads: 0, topModels: [] }
    }
}

export async function fetchHuggingFaceData(): Promise<HuggingFaceData> {
    const orgs = await Promise.all(CANADIAN_ORGS.map((o) => fetchOrgModels(o.slug, o.name, o.search)))
    const totalModels = orgs.reduce((sum, o) => sum + o.modelCount, 0)
    const totalDownloads = orgs.reduce((sum, o) => sum + o.totalDownloads, 0)

    return { orgs, totalModels, totalDownloads, fetchedAt: new Date().toISOString() }
}
