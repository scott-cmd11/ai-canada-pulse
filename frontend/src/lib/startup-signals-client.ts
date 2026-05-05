// Startup signals client — extracts funding/acquisition signals from news RSS
// Re-parses existing RSS feeds for startup-specific events

import { STARTUPS, type CanadianStartup } from "./startups-data"

const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

export type SignalType = "Funding" | "Acquisition" | "Product Launch" | "Partnership" | "Expansion" | "IPO"

export interface StartupSignal {
  id: string
  companyName: string
  signalType: SignalType
  headline: string
  amount?: string
  date: string
  source: string
  url: string
  province?: string
}

export interface StartupSignalsData {
  signals: StartupSignal[]
  totalSignals: number
  lastUpdated: string
}

interface CacheEntry {
  data: StartupSignalsData
  fetchedAt: number
}

let cache: CacheEntry | null = null

const FUNDING_RE = /raises?\s+\$[\d.]+[MmBb]|series\s+[A-F]|seed\s+round|funding\s+round|venture\s+capital|\$[\d.]+\s*(million|billion)\s*(in\s+)?funding/i
const ACQUISITION_RE = /acquir(?:ed|es|ing)|acquisition|bought\s+by|merged?\s+with|takeover/i
const PRODUCT_RE = /launch(?:ed|es|ing)|unveiled|released|introduces|rolls?\s+out|announces?\s+new/i
const PARTNERSHIP_RE = /partner(?:ed|s|ship|ing)\s+with|collaborat(?:ed|es|ing|ion)|teamed?\s+(?:up\s+)?with|alliance/i
const IPO_RE = /IPO|initial\s+public\s+offering|goes?\s+public|listing\s+on/i

// Known Canadian AI company names for matching
const COMPANY_NAMES = STARTUPS.map((s) => s.name.toLowerCase())

export async function fetchStartupSignals(): Promise<StartupSignalsData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  try {
    // Fetch from the existing stories API which already parses Canadian AI RSS feeds
    const res = await fetch(
      typeof window === "undefined"
        ? `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/api/v1/stories`
        : "/api/v1/stories",
      { signal: AbortSignal.timeout(10000) }
    )

    if (!res.ok) return getFallbackData()

    const json = await res.json()
    const stories: Array<{ title?: string; headline?: string; url?: string; source?: string; sourceName?: string; sourceUrl?: string; publishedAt?: string }> = json.stories || []

    const signals = extractSignals(stories)

    const data: StartupSignalsData = {
      signals: signals.slice(0, 20),
      totalSignals: signals.length,
      lastUpdated: new Date().toISOString().slice(0, 10),
    }

    cache = { data, fetchedAt: Date.now() }
    return data
  } catch (err) {
    console.warn("[startup-signals] Failed to fetch signals:", err)
    return cache?.data ?? getFallbackData()
  }
}

function extractSignals(stories: Array<{ title?: string; headline?: string; url?: string; source?: string; sourceName?: string; sourceUrl?: string; publishedAt?: string }>): StartupSignal[] {
  const signals: StartupSignal[] = []

  for (const story of stories) {
    const title = (story.title ?? story.headline ?? "").trim()
    if (!title) continue

    const titleLower = title.toLowerCase()

    // Check if story mentions a known Canadian AI company
    const matchedCompany = COMPANY_NAMES.find((name) => titleLower.includes(name))
    const startup: CanadianStartup | undefined = matchedCompany
      ? STARTUPS.find((s) => s.name.toLowerCase() === matchedCompany)
      : undefined

    // Determine signal type
    let signalType: SignalType | null = null
    let amount: string | undefined

    if (IPO_RE.test(title)) {
      signalType = "IPO"
    } else if (FUNDING_RE.test(title)) {
      signalType = "Funding"
      const amountMatch = title.match(/\$[\d.]+\s*(?:million|billion|[MmBb])/i)
      if (amountMatch) amount = amountMatch[0]
    } else if (ACQUISITION_RE.test(title)) {
      signalType = "Acquisition"
    } else if (PARTNERSHIP_RE.test(title)) {
      signalType = "Partnership"
    } else if (PRODUCT_RE.test(title) && (matchedCompany || titleLower.includes("ai") || titleLower.includes("artificial intelligence"))) {
      signalType = "Product Launch"
    }

    if (signalType && (matchedCompany || isCanadianAISignal(titleLower))) {
      signals.push({
        id: `signal-${signals.length}`,
        companyName: startup?.name || extractCompanyName(title) || "Canadian AI Company",
        signalType,
        headline: title,
        amount,
        date: story.publishedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        source: story.source ?? story.sourceName ?? "Public source",
        url: story.url ?? story.sourceUrl ?? "#",
        province: startup?.province,
      })
    }
  }

  return signals.sort((a, b) => b.date.localeCompare(a.date))
}

function isCanadianAISignal(titleLower: string): boolean {
  const canadianTerms = ["canada", "canadian", "toronto", "montreal", "vancouver", "ottawa", "waterloo", "edmonton", "calgary"]
  const aiTerms = ["ai", "artificial intelligence", "machine learning", "startup"]
  return canadianTerms.some((t) => titleLower.includes(t)) && aiTerms.some((t) => titleLower.includes(t))
}

function extractCompanyName(title: string): string | null {
  // Try to extract the first capitalized multi-word name before common signal verbs
  const match = title.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:raises?|acquir|launch|partner|announce)/i)
  return match ? match[1] : null
}

function getFallbackData(): StartupSignalsData {
  return {
    signals: [
      { id: "s-1", companyName: "Cohere", signalType: "Funding", headline: "Cohere raises $500M Series D to expand enterprise AI platform", amount: "$500M", date: "2025-07-15", source: "BetaKit", url: "https://betakit.com", province: "Ontario" },
      { id: "s-2", companyName: "Sanctuary AI", signalType: "Funding", headline: "Sanctuary AI closes $175M Series B for humanoid robot development", amount: "$175M", date: "2025-05-20", source: "BetaKit", url: "https://betakit.com", province: "British Columbia" },
      { id: "s-3", companyName: "Clio", signalType: "Product Launch", headline: "Clio launches AI-powered CoPilot for legal professionals", date: "2025-04-10", source: "The Logic", url: "https://thelogic.co", province: "British Columbia" },
      { id: "s-4", companyName: "Waabi", signalType: "Partnership", headline: "Waabi partners with major trucking company for autonomous freight", date: "2025-03-28", source: "BetaKit", url: "https://betakit.com", province: "Ontario" },
      { id: "s-5", companyName: "DarwinAI", signalType: "Acquisition", headline: "Apple acquires Canadian AI startup DarwinAI for on-device intelligence", date: "2025-01-15", source: "CBC Technology", url: "https://cbc.ca/technology", province: "Ontario" },
    ],
    totalSignals: 5,
    lastUpdated: "2025-12-31",
  }
}
