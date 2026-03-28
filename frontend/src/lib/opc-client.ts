// Office of the Privacy Commissioner (OPC) client
// Fetches AI-related privacy decisions and guidance
// Source: https://www.priv.gc.ca

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export interface OPCDecision {
  id: string
  title: string
  date: string
  type: "Finding" | "Guidance" | "Report" | "Consultation"
  summary: string
  url: string
}

export interface OPCData {
  decisions: OPCDecision[]
  totalDecisions: number
  lastUpdated: string
}

interface CacheEntry {
  data: OPCData
  fetchedAt: number
}

let cache: CacheEntry | null = null

const AI_KEYWORDS_RE = /artificial intelligence|machine learning|automated decision|algorithmic|facial recognition|biometric|profiling|generative ai|chatbot|personal information.*automat/i

export async function fetchOPCData(): Promise<OPCData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  try {
    // OPC publishes an RSS/Atom feed for news and guidance
    const res = await fetch("https://www.priv.gc.ca/en/opc-news/news-and-announcements/rss/", {
      headers: { "User-Agent": "AICanadaPulse/1.0", Accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return getFallbackData()

    const xmlText = await res.text()
    const data = parseOPCFeed(xmlText)

    if (data.decisions.length > 0) {
      cache = { data, fetchedAt: Date.now() }
      return data
    }

    return getFallbackData()
  } catch (err) {
    console.warn("[opc-client] Failed to fetch OPC data:", err)
    return cache?.data ?? getFallbackData()
  }
}

function parseOPCFeed(xml: string): OPCData {
  const decisions: OPCDecision[] = []
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || xml.match(/<entry>[\s\S]*?<\/entry>/gi) || []

  for (const item of items) {
    const title = extractTag(item, "title")
    const description = extractTag(item, "description") || extractTag(item, "summary") || ""
    const link = extractTag(item, "link") || extractHref(item)
    const pubDate = extractTag(item, "pubDate") || extractTag(item, "published") || ""

    if (AI_KEYWORDS_RE.test(title) || AI_KEYWORDS_RE.test(description)) {
      const type = inferDecisionType(title)
      decisions.push({
        id: `opc-${decisions.length}`,
        title: truncate(title, 200),
        date: parseDate(pubDate),
        type,
        summary: truncate(stripHtml(description), 300),
        url: link,
      })
    }
  }

  return {
    decisions: decisions.sort((a, b) => b.date.localeCompare(a.date)),
    totalDecisions: decisions.length,
    lastUpdated: new Date().toISOString().slice(0, 10),
  }
}

function inferDecisionType(title: string): OPCDecision["type"] {
  const lower = title.toLowerCase()
  if (lower.includes("finding") || lower.includes("investigation")) return "Finding"
  if (lower.includes("guidance") || lower.includes("guide") || lower.includes("principle")) return "Guidance"
  if (lower.includes("consultation") || lower.includes("comment")) return "Consultation"
  return "Report"
}

function extractTag(xml: string, tag: string): string {
  // Handle CDATA
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i"))
  if (cdataMatch) return cdataMatch[1].trim()
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"))
  return match ? match[1].trim() : ""
}

function extractHref(xml: string): string {
  const match = xml.match(/<link[^>]+href="([^"]+)"/i)
  return match ? match[1] : ""
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len).trimEnd() + "..."
}

function parseDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().slice(0, 10)
  } catch {
    return ""
  }
}

function getFallbackData(): OPCData {
  return {
    decisions: [
      {
        id: "opc-1",
        title: "Principles for responsible, trustworthy and privacy-protective generative AI technologies",
        date: "2023-12-07",
        type: "Guidance",
        summary: "Joint statement with provincial and territorial privacy commissioners outlining principles for generative AI, including purpose limitation, transparency, and accountability.",
        url: "https://www.priv.gc.ca/en/privacy-topics/technology/artificial-intelligence/gd_principles_ai/",
      },
      {
        id: "opc-2",
        title: "Investigation into Clearview AI's use of facial recognition technology",
        date: "2021-02-03",
        type: "Finding",
        summary: "Joint investigation found Clearview AI violated federal and provincial privacy laws by scraping images without consent for facial recognition database.",
        url: "https://www.priv.gc.ca/en/opc-actions-and-decisions/investigations/investigations-into-businesses/2021/pipeda-2021-001/",
      },
      {
        id: "opc-3",
        title: "Privacy and AI: Proposals for the regulation of artificial intelligence",
        date: "2020-11-12",
        type: "Report",
        summary: "OPC policy paper on how to regulate AI in Canada, advocating for rights-based approaches and transparency requirements.",
        url: "https://www.priv.gc.ca/en/about-the-opc/what-we-do/consultations/completed-consultations/consultation-ai/reg_framework_ai/",
      },
      {
        id: "opc-4",
        title: "OPC submission on the Artificial Intelligence and Data Act (AIDA)",
        date: "2023-04-24",
        type: "Consultation",
        summary: "Formal submission to Parliament outlining concerns about AIDA's scope, enforcement mechanisms, and relationship to privacy law.",
        url: "https://www.priv.gc.ca/en/opc-actions-and-decisions/submissions-to-consultations/sub_aida_2304/",
      },
      {
        id: "opc-5",
        title: "Investigation into OpenAI and ChatGPT privacy practices",
        date: "2024-01-29",
        type: "Finding",
        summary: "Investigation into ChatGPT's collection and use of personal information, including training data practices and user data handling.",
        url: "https://www.priv.gc.ca/en/opc-actions-and-decisions/investigations/investigations-into-businesses/2024/",
      },
    ],
    totalDecisions: 5,
    lastUpdated: "2025-12-31",
  }
}
