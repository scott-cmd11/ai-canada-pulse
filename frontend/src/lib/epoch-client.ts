// Epoch AI dataset client — fetches notable AI models CSV
// Data: https://epoch.ai/data/ai-models (CC-BY 4.0)
// CSV columns: Model, Organization, Publication date, Training compute (FLOP), Parameters, Domain, ...

import { unstable_cache } from "next/cache"

export interface EpochModel {
    name: string
    org: string
    date: string            // YYYY-MM-DD
    trainingCompute: number // FLOP
    parameters: number | null
    domain: string
}

export interface EpochStats {
    totalModels: number
    modelsThisYear: number
    latestModel: { name: string; org: string; date: string } | null
    computeDoublingMonths: number
    largestComputeFlop: number
}

export interface EpochResult {
    models: EpochModel[]
    stats: EpochStats
    fetchedAt: string
}

const CSV_URL = "https://epoch.ai/data/notable_ai_models.csv"

/** Parse a single CSV row respecting quoted fields */
function parseCSVRow(line: string): string[] {
    const fields: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++ // skip escaped quote
            } else {
                inQuotes = !inQuotes
            }
        } else if (ch === "," && !inQuotes) {
            fields.push(current.trim())
            current = ""
        } else {
            current += ch
        }
    }
    fields.push(current.trim())
    return fields
}

/** Parse YYYY-MM-DD or various date formats from Epoch CSV */
function parseDate(raw: string): string | null {
    if (!raw) return null
    // Try direct ISO parse
    const d = new Date(raw)
    if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10)
    }
    return null
}

async function _fetchEpochModels(): Promise<EpochResult> {
    try {
        const res = await fetch(CSV_URL, {
            headers: { "User-Agent": "AICanadaPulse/1.0" },
        })

        if (!res.ok) {
            console.warn(`[epoch-client] CSV fetch failed: ${res.status}`)
            return emptyResult()
        }

        const text = await res.text()
        const lines = text.split("\n").filter(Boolean)

        if (lines.length < 2) return emptyResult()

        // Parse header to find column indices
        const header = parseCSVRow(lines[0])
        const idx = {
            name: header.indexOf("Model"),
            org: header.indexOf("Organization"),
            date: header.indexOf("Publication date"),
            compute: header.indexOf("Training compute (FLOP)"),
            params: header.indexOf("Parameters"),
            domain: header.indexOf("Domain"),
        }

        // Validate required columns exist
        if (idx.name === -1 || idx.date === -1 || idx.compute === -1) {
            console.warn("[epoch-client] Missing required CSV columns")
            return emptyResult()
        }

        const models: EpochModel[] = []

        for (let i = 1; i < lines.length; i++) {
            const fields = parseCSVRow(lines[i])
            const name = fields[idx.name]?.replace(/\n/g, " ").trim()
            const org = fields[idx.org]?.replace(/\n/g, " ").trim() || "Unknown"
            const rawDate = fields[idx.date]
            const rawCompute = fields[idx.compute]
            const rawParams = fields[idx.params]
            const domain = fields[idx.domain]?.split(",")[0]?.trim() || "Other"

            const date = parseDate(rawDate)
            const trainingCompute = parseFloat(rawCompute)

            // Skip rows without valid date or training compute
            if (!date || !trainingCompute || isNaN(trainingCompute) || trainingCompute <= 0) continue
            if (!name) continue

            const parameters = rawParams ? parseFloat(rawParams) : null

            models.push({
                name,
                org,
                date,
                trainingCompute,
                parameters: parameters && !isNaN(parameters) && parameters > 0 ? parameters : null,
                domain,
            })
        }

        // Sort by date ascending
        models.sort((a, b) => a.date.localeCompare(b.date))

        // Compute stats
        const currentYear = new Date().getFullYear().toString()
        const modelsThisYear = models.filter((m) => m.date.startsWith(currentYear)).length
        const latestModel = models.length > 0 ? models[models.length - 1] : null
        const largestCompute = models.reduce((max, m) => Math.max(max, m.trainingCompute), 0)

        // Estimate compute doubling time from frontier models (2020+)
        const recentFrontier = models
            .filter((m) => m.date >= "2020-01-01")
            .sort((a, b) => a.trainingCompute - b.trainingCompute)

        let computeDoublingMonths = 6 // Default from Epoch AI's own analysis
        if (recentFrontier.length >= 10) {
            // Use linear regression on log(compute) vs time to estimate doubling
            const points = recentFrontier.map((m) => ({
                t: new Date(m.date).getTime() / (1000 * 60 * 60 * 24 * 30), // months
                logC: Math.log2(m.trainingCompute),
            }))
            const n = points.length
            const sumT = points.reduce((s, p) => s + p.t, 0)
            const sumLC = points.reduce((s, p) => s + p.logC, 0)
            const sumTLC = points.reduce((s, p) => s + p.t * p.logC, 0)
            const sumT2 = points.reduce((s, p) => s + p.t * p.t, 0)

            const slope = (n * sumTLC - sumT * sumLC) / (n * sumT2 - sumT * sumT)
            if (slope > 0) {
                computeDoublingMonths = Math.round(1 / slope)
                // Sanity check: Epoch AI says ~5-6 months
                if (computeDoublingMonths < 2 || computeDoublingMonths > 24) {
                    computeDoublingMonths = 6
                }
            }
        }

        const stats: EpochStats = {
            totalModels: models.length,
            modelsThisYear,
            latestModel: latestModel
                ? { name: latestModel.name, org: latestModel.org, date: latestModel.date }
                : null,
            computeDoublingMonths,
            largestComputeFlop: largestCompute,
        }

        return { models, stats, fetchedAt: new Date().toISOString() }
    } catch (err) {
        console.warn("[epoch-client] Failed to fetch Epoch AI data:", err)
        return emptyResult()
    }
}

function emptyResult(): EpochResult {
    return {
        models: [],
        stats: {
            totalModels: 0,
            modelsThisYear: 0,
            latestModel: null,
            computeDoublingMonths: 6,
            largestComputeFlop: 0,
        },
        fetchedAt: new Date().toISOString(),
    }
}

export const fetchEpochModels = unstable_cache(
    _fetchEpochModels,
    ["epoch-ai-notable-models"],
    { revalidate: 43200 } // 12 hours — data updates ~weekly
)
