// Global AI data client
// Fetches international AI news, trends by country, and research output
// All sources are free and require no API keys

import { unstable_cache } from "next/cache"
import Parser from "rss-parser"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api")

const OPENALEX_BASE = "https://api.openalex.org"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GlobalStory {
    headline: string
    summary: string
    sourceUrl: string
    sourceName: string
    region: string
    publishedAt: string
}

export interface CountryInterest {
    country: string
    code: string
    value: number
    isCanada: boolean
}

export interface CountryResearch {
    country: string
    code: string
    paperCount: number
    isCanada: boolean
}

// ─── Region detection from headlines ────────────────────────────────────────

const REGION_PATTERNS: { pattern: RegExp; region: string }[] = [
    { pattern: /\b(China|Chinese|Beijing|Baidu|Alibaba|Tencent|DeepSeek)\b/i, region: "China" },
    { pattern: /\b(EU|European|Brussels|Europe)\b/i, region: "EU" },
    { pattern: /\b(UK|British|London|Britain)\b/i, region: "UK" },
    { pattern: /\b(Japan|Japanese|Tokyo|SoftBank)\b/i, region: "Japan" },
    { pattern: /\b(Korea|Korean|Seoul|Samsung)\b/i, region: "South Korea" },
    { pattern: /\b(India|Indian|Delhi|Bangalore|Mumbai)\b/i, region: "India" },
    { pattern: /\b(Australia|Australian|Sydney|Melbourne)\b/i, region: "Australia" },
    { pattern: /\b(France|French|Paris|Mistral)\b/i, region: "France" },
    { pattern: /\b(Germany|German|Berlin|Munich)\b/i, region: "Germany" },
    { pattern: /\b(Israel|Israeli|Tel Aviv)\b/i, region: "Israel" },
    { pattern: /\b(US|United States|American|Washington|Silicon Valley|San Francisco|OpenAI|Google|Meta|Microsoft|Apple|Amazon|Nvidia)\b/i, region: "United States" },
]

function detectGlobalRegion(title: string, desc: string): string {
    const text = `${title} ${desc}`
    for (const { pattern, region } of REGION_PATTERNS) {
        if (pattern.test(text)) return region
    }
    return "Global"
}

// ─── 1. Global AI News ──────────────────────────────────────────────────────

const parser = new Parser({
    timeout: 10000,
    headers: { "User-Agent": "AICanadaPulse/1.0 (news aggregator)" },
})

async function _fetchGlobalAINews(): Promise<GlobalStory[]> {
    try {
        const feed = await parser.parseURL(
            "https://news.google.com/rss/search?q=artificial+intelligence&hl=en&gl=US&ceid=US:en"
        )

        const stories: GlobalStory[] = (feed.items || [])
            .slice(0, 12)
            .map((item) => {
                const title = item.title || ""
                const desc = item.contentSnippet || item.content || ""
                // Google News titles often end with " - Source Name"
                const parts = title.split(" - ")
                const sourceName = parts.length > 1 ? parts.pop()!.trim() : "Google News"
                const headline = parts.join(" - ").trim()

                return {
                    headline,
                    summary: desc.slice(0, 200),
                    sourceUrl: item.link || "",
                    sourceName,
                    region: detectGlobalRegion(title, desc),
                    publishedAt: item.isoDate || new Date().toISOString(),
                }
            })

        return stories
    } catch (err) {
        console.warn("[global-client] Failed to fetch global AI news:", err)
        return []
    }
}

export const fetchGlobalAINews = unstable_cache(
    _fetchGlobalAINews,
    ["global-ai-news"],
    { revalidate: 1800 } // 30 minutes
)

// ─── 2. Global AI Interest by Country ───────────────────────────────────────

const COUNTRY_MAP: Record<string, string> = {
    "US": "United States", "CN": "China", "GB": "United Kingdom", "DE": "Germany",
    "FR": "France", "JP": "Japan", "KR": "South Korea", "IN": "India",
    "CA": "Canada", "AU": "Australia", "IL": "Israel", "SG": "Singapore",
    "NL": "Netherlands", "SE": "Sweden", "CH": "Switzerland", "BR": "Brazil",
    "IE": "Ireland", "FI": "Finland", "AE": "UAE", "ES": "Spain",
}

async function _fetchGlobalAIInterest(): Promise<CountryInterest[]> {
    try {
        const result = await googleTrends.interestByRegion({
            keyword: "artificial intelligence",
            resolution: "COUNTRY",
            startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // last 90 days
        })

        const parsed = JSON.parse(result)
        const geoData = parsed?.default?.geoMapData || []

        const data: CountryInterest[] = geoData
            .filter((item: { geoCode: string; value: number[] }) => item.value[0] > 0)
            .map((item: { geoCode: string; geoName: string; value: number[] }) => ({
                country: item.geoName,
                code: item.geoCode,
                value: item.value[0],
                isCanada: item.geoCode === "CA",
            }))
            .sort((a: CountryInterest, b: CountryInterest) => b.value - a.value)
            .slice(0, 20)

        if (data.length > 0) return data
        return FALLBACK_INTEREST
    } catch (err) {
        console.warn("[global-client] Google Trends interestByRegion failed, using fallback:", err)
        return FALLBACK_INTEREST
    }
}

const FALLBACK_INTEREST: CountryInterest[] = [
    { country: "China", code: "CN", value: 100, isCanada: false },
    { country: "Singapore", code: "SG", value: 82, isCanada: false },
    { country: "India", code: "IN", value: 72, isCanada: false },
    { country: "United States", code: "US", value: 68, isCanada: false },
    { country: "United Kingdom", code: "GB", value: 61, isCanada: false },
    { country: "Australia", code: "AU", value: 58, isCanada: false },
    { country: "Canada", code: "CA", value: 55, isCanada: true },
    { country: "Germany", code: "DE", value: 48, isCanada: false },
    { country: "France", code: "FR", value: 44, isCanada: false },
    { country: "South Korea", code: "KR", value: 42, isCanada: false },
    { country: "Netherlands", code: "NL", value: 40, isCanada: false },
    { country: "Japan", code: "JP", value: 38, isCanada: false },
    { country: "Israel", code: "IL", value: 36, isCanada: false },
    { country: "Brazil", code: "BR", value: 32, isCanada: false },
    { country: "Sweden", code: "SE", value: 28, isCanada: false },
]

export const fetchGlobalAIInterest = unstable_cache(
    _fetchGlobalAIInterest,
    ["global-ai-interest-by-country"],
    { revalidate: 21600 } // 6 hours
)

// ─── 3. Global Research Output by Country ───────────────────────────────────

async function _fetchGlobalResearchOutput(): Promise<CountryResearch[]> {
    try {
        const today = new Date().toISOString().slice(0, 10)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        const fromDate = oneYearAgo.toISOString().slice(0, 10)

        const params = new URLSearchParams({
            search: "artificial intelligence machine learning deep learning",
            filter: `from_publication_date:${fromDate},to_publication_date:${today},type:article|preprint`,
            group_by: "institutions.country_code",
        })

        const res = await fetch(`${OPENALEX_BASE}/works?${params}`, {
            headers: {
                "User-Agent": "AICanadaPulse/1.0 (mailto:contact@aicanadapulse.ca)",
            },
        })

        if (!res.ok) return FALLBACK_RESEARCH

        const json = await res.json()
        const groups = json.group_by || []

        const data: CountryResearch[] = groups
            .filter((g: { key: string; count: number }) => g.key && COUNTRY_MAP[g.key])
            .map((g: { key: string; count: number }) => ({
                country: COUNTRY_MAP[g.key] || g.key,
                code: g.key,
                paperCount: g.count,
                isCanada: g.key === "CA",
            }))
            .sort((a: CountryResearch, b: CountryResearch) => b.paperCount - a.paperCount)
            .slice(0, 15)

        if (data.length > 0) return data
        return FALLBACK_RESEARCH
    } catch (err) {
        console.warn("[global-client] OpenAlex group_by failed, using fallback:", err)
        return FALLBACK_RESEARCH
    }
}

const FALLBACK_RESEARCH: CountryResearch[] = [
    { country: "China", code: "CN", paperCount: 142000, isCanada: false },
    { country: "United States", code: "US", paperCount: 128000, isCanada: false },
    { country: "United Kingdom", code: "GB", paperCount: 32000, isCanada: false },
    { country: "India", code: "IN", paperCount: 28000, isCanada: false },
    { country: "Germany", code: "DE", paperCount: 22000, isCanada: false },
    { country: "Canada", code: "CA", paperCount: 18000, isCanada: true },
    { country: "France", code: "FR", paperCount: 16000, isCanada: false },
    { country: "Japan", code: "JP", paperCount: 14000, isCanada: false },
    { country: "South Korea", code: "KR", paperCount: 13000, isCanada: false },
    { country: "Australia", code: "AU", paperCount: 11000, isCanada: false },
    { country: "Italy", code: "IT", paperCount: 10000, isCanada: false },
    { country: "Netherlands", code: "NL", paperCount: 8000, isCanada: false },
    { country: "Singapore", code: "SG", paperCount: 7500, isCanada: false },
    { country: "Switzerland", code: "CH", paperCount: 7000, isCanada: false },
    { country: "Israel", code: "IL", paperCount: 6500, isCanada: false },
]

export const fetchGlobalResearchOutput = unstable_cache(
    _fetchGlobalResearchOutput,
    ["global-ai-research-by-country"],
    { revalidate: 21600 } // 6 hours
)
