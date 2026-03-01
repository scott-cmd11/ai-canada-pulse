/**
 * Hugging Face Hub API Client
 * Tracks Canadian AI organization models and downloads from
 * Vector Institute, Mila, Amii, and Cohere.
 */

const HF_API_TOKEN = process.env.HF_API_TOKEN ?? ""
const HF_BASE = "https://huggingface.co/api"
const TIMEOUT_MS = 15_000

const CANADIAN_ORGS = [
    { slug: "VectorInstitute", name: "Vector Institute" },
    { slug: "maboroshii", name: "Mila" },   // Mila's primary org
    { slug: "Amii", name: "Amii" },
    { slug: "CohereForAI", name: "Cohere" },
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

async function fetchOrgModels(slug: string, name: string): Promise<HFOrgStats> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (HF_API_TOKEN) headers["Authorization"] = `Bearer ${HF_API_TOKEN}`

    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const res = await fetch(`${HF_BASE}/models?author=${slug}&limit=100`, {
            headers,
            signal: controller.signal,
        })
        clearTimeout(timer)

        if (!res.ok) {
            console.warn(`[hf-client] Error fetching ${slug}: ${res.status}`)
            return { orgName: name, orgSlug: slug, modelCount: 0, totalDownloads: 0, topModels: [] }
        }

        const models = (await res.json()) as {
            id?: string
            downloads?: number
            pipeline_tag?: string
        }[]

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
    const orgs = await Promise.all(CANADIAN_ORGS.map((o) => fetchOrgModels(o.slug, o.name)))
    const totalModels = orgs.reduce((sum, o) => sum + o.modelCount, 0)
    const totalDownloads = orgs.reduce((sum, o) => sum + o.totalDownloads, 0)

    return { orgs, totalModels, totalDownloads, fetchedAt: new Date().toISOString() }
}
