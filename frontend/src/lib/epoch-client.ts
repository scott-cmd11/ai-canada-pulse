// METR.org Time Horizons client — fetches benchmark results YAML
// Data: https://metr.org/time-horizons/ (CC-BY)
// YAML: https://metr.org/assets/benchmark_results_1_1.yaml

import { unstable_cache } from "next/cache"

export interface METRModel {
    id: string
    name: string          // Human-readable name
    releaseDate: string   // YYYY-MM-DD
    p50Hours: number      // 50% time horizon in hours
    p80Hours: number      // 80% time horizon in hours
    p50CILow: number     // confidence interval low (hours)
    p50CIHigh: number    // confidence interval high (hours)
    p80CILow: number
    p80CIHigh: number
    avgScore: number
    isSota: boolean
}

export interface METRStats {
    doublingTimeDays: number   // Time horizon doubles every N days
    latestModel: { name: string; releaseDate: string; p50Hours: number } | null
    totalModels: number
    highestP50Hours: number
}

export interface METRResult {
    models: METRModel[]
    stats: METRStats
    fetchedAt: string
}

const YAML_URL = "https://metr.org/assets/benchmark_results_1_1.yaml"

/** Convert model ID from YAML key to a readable display name */
function prettifyModelName(id: string): string {
    const nameMap: Record<string, string> = {
        gpt2: "GPT-2",
        davinci_002: "Davinci 002",
        gpt_3_5_turbo_instruct: "GPT-3.5 Turbo",
        gpt_4: "GPT-4",
        gpt_4_1106_inspect: "GPT-4 Turbo (Nov'23)",
        gpt_4_turbo_inspect: "GPT-4 Turbo",
        gpt_4o_inspect: "GPT-4o",
        o1_preview: "o1-preview",
        o1_inspect: "o1",
        o3_inspect: "o3",
        gpt_5_2025_08_07_inspect: "GPT-5",
        gpt_5_1_codex_max_inspect: "GPT-5.1 Codex Max",
        gpt_5_2: "GPT-5.2",
        gpt_5_3_codex: "GPT-5.3 Codex",
        claude_3_opus_inspect: "Claude 3 Opus",
        claude_3_5_sonnet_20240620_inspect: "Claude 3.5 Sonnet",
        claude_3_5_sonnet_20241022_inspect: "Claude 3.5 Sonnet (Oct'24)",
        claude_3_7_sonnet_inspect: "Claude 3.7 Sonnet",
        claude_4_opus_inspect: "Claude 4 Opus",
        claude_4_1_opus_inspect: "Claude 4.1 Opus",
        claude_opus_4_5_inspect: "Claude Opus 4.5",
        claude_opus_4_6_inspect: "Claude Opus 4.6",
        claude_4_5_sonnet_inspect: "Claude 4.5 Sonnet",
        gemini_3_pro: "Gemini 3 Pro",
        deepseek_r1_inspect: "DeepSeek-R1",
        deepseek_v3_inspect: "DeepSeek-V3",
        grok_4_inspect: "Grok-4",
        kimi_k2_thinking_inspect: "Kimi K2 Thinking",
        o4_mini_inspect: "o4-mini",
        qwen_25_72b_inspect: "Qwen 2.5 72B",
        qwen_qwq_32b_inspect: "Qwen QwQ 32B",
        gpt_oss_120b_inspect: "GPT-OSS 120B",
    }
    return nameMap[id] || id
        .replace(/_inspect$/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Minimal YAML parser for the METR benchmark results structure */
function parseMETRYaml(text: string): METRResult {
    const models: METRModel[] = []
    let doublingTimeDays = 129 // default from METR's analysis

    // Extract doubling time
    const doublingMatch = text.match(/from_2023_on:\s*\n(?:.*\n)*?\s*point_estimate:\s*([\d.]+)/)
    if (doublingMatch) {
        doublingTimeDays = Math.round(parseFloat(doublingMatch[1]))
    }

    // Extract each model result block
    // Pattern: key name at 2-space indent, followed by nested data
    const resultSection = text.split(/^results:\s*$/m)[1]
    if (!resultSection) return emptyResult()

    // Split into model blocks by finding top-level keys (2-space indent)
    const modelBlocks = resultSection.split(/\n  (?=[a-z])/g).filter(Boolean)

    for (const block of modelBlocks) {
        const lines = block.split("\n")
        const idLine = lines[0]?.trim()
        if (!idLine) continue

        const id = idLine.replace(/:$/, "").trim()
        if (!id || id.startsWith("#")) continue

        // Extract values using regex
        const getVal = (key: string): number | null => {
            const match = block.match(new RegExp(`${key}:\\s*\\n\\s*(?:.*\\n)*?\\s*estimate:\\s*([\\d.e+-]+)`, "m"))
                || block.match(new RegExp(`${key}:[\\s\\S]*?estimate:\\s*([\\d.e+-]+)`))
            return match ? parseFloat(match[1]) : null
        }

        const getNestedVal = (parent: string, key: string): number | null => {
            // Find the parent block first, then the key within it
            const parentMatch = block.match(new RegExp(`${parent}:\\s*\\n([\\s\\S]*?)(?=\\n\\s{6}\\w|$)`))
            if (!parentMatch) return null
            const subBlock = parentMatch[1]
            const valMatch = subBlock.match(new RegExp(`${key}:\\s*([\\d.e+-]+)`))
            return valMatch ? parseFloat(valMatch[1]) : null
        }

        const releaseMatch = block.match(/release_date:\s*(\d{4}-\d{2}-\d{2})/)
        const sotaMatch = block.match(/is_sota:\s*(true|false)/)
        const avgScore = getVal("average_score")

        // Get p50 and p80 horizon values
        const p50 = getVal("p50_horizon_length")
        const p80 = getVal("p80_horizon_length")

        // Get confidence intervals
        const p50Section = block.match(/p50_horizon_length:\s*\n([\s\S]*?)(?=\n\s{6}\w|\n\s{4}\w)/)?.[1] || ""
        const p80Section = block.match(/p80_horizon_length:\s*\n([\s\S]*?)(?=\n\s{6}\w|\n\s{4}\w)/)?.[1] || ""

        const p50CILow = parseFloat(p50Section.match(/ci_low:\s*([\d.e+-]+)/)?.[1] || "0")
        const p50CIHigh = parseFloat(p50Section.match(/ci_high:\s*([\d.e+-]+)/)?.[1] || "0")
        const p80CILow = parseFloat(p80Section.match(/ci_low:\s*([\d.e+-]+)/)?.[1] || "0")
        const p80CIHigh = parseFloat(p80Section.match(/ci_high:\s*([\d.e+-]+)/)?.[1] || "0")

        if (!releaseMatch || p50 === null) continue

        // Convert from minutes to hours
        const toHours = (mins: number) => mins / 60

        models.push({
            id,
            name: prettifyModelName(id),
            releaseDate: releaseMatch[1],
            p50Hours: toHours(p50),
            p80Hours: p80 !== null ? toHours(p80) : 0,
            p50CILow: toHours(p50CILow),
            p50CIHigh: toHours(p50CIHigh),
            p80CILow: toHours(p80CILow),
            p80CIHigh: toHours(p80CIHigh),
            avgScore: avgScore || 0,
            isSota: sotaMatch?.[1] === "true",
        })
    }

    // Sort by release date
    models.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))

    const highestP50 = models.reduce((max, m) => Math.max(max, m.p50Hours), 0)
    const latestModel = models.length > 0 ? models[models.length - 1] : null

    const stats: METRStats = {
        doublingTimeDays,
        totalModels: models.length,
        highestP50Hours: highestP50,
        latestModel: latestModel
            ? { name: latestModel.name, releaseDate: latestModel.releaseDate, p50Hours: latestModel.p50Hours }
            : null,
    }

    return { models, stats, fetchedAt: new Date().toISOString() }
}

async function _fetchMETRTimeHorizons(): Promise<METRResult> {
    try {
        const res = await fetch(YAML_URL, {
            headers: { "User-Agent": "AICanadaPulse/1.0" },
        })

        if (!res.ok) {
            console.warn(`[metr-client] YAML fetch failed: ${res.status}`)
            return emptyResult()
        }

        const text = await res.text()
        return parseMETRYaml(text)
    } catch (err) {
        console.warn("[metr-client] Failed to fetch METR data:", err)
        return emptyResult()
    }
}

function emptyResult(): METRResult {
    return {
        models: [],
        stats: {
            doublingTimeDays: 129,
            totalModels: 0,
            highestP50Hours: 0,
            latestModel: null,
        },
        fetchedAt: new Date().toISOString(),
    }
}

export const fetchMETRTimeHorizons = unstable_cache(
    _fetchMETRTimeHorizons,
    ["metr-time-horizons"],
    { revalidate: 43200 } // 12 hours — data updates periodically
)
