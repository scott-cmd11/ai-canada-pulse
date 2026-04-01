// OpenParliament.ca API client
// Tracks AI-related mentions in the federal House of Commons (Hansard).
// Source: OpenParliament.ca — https://api.openparliament.ca/
// Data originates from Hansard (official transcripts), bilingual (EN + FR).
// NOTE: Federal Parliament only — does not cover the Senate or provincial/territorial legislatures.
// Docs: https://api.openparliament.ca/

const OPENPARL_BASE = "https://api.openparliament.ca"
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

export interface ParliamentMention {
  url: string
  date: string
  speaker: string
  party: string
  topic: string
  excerpt: string
}

export interface ParliamentData {
  mentions: ParliamentMention[]
  totalCount: number
}

interface CacheEntry {
  data: ParliamentData
  fetchedAt: number
}

let cache: CacheEntry | null = null

// Bilingual keyword filter — used to verify content relevance after a search result is returned.
const AI_KEYWORDS = /artificial intelligence|machine learning|generative ai|aida|algorithmic|deep learning|large language model|chatgpt|openai|AI\s+regulation|AI\s+act|intelligence artificielle|apprentissage automatique|apprentissage profond|modèle de langage|IA générative|réglementation.*IA|loi.*IA/i

// Search queries sent to OpenParliament.ca's full-text search API.
// Multiple targeted queries are run in parallel and deduplicated — this covers all of Hansard history,
// not just the 5 most recent debates.
const SEARCH_QUERIES = [
  "artificial intelligence",
  "intelligence artificielle",
  "machine learning",
  "generative AI",
]

/** Extract date from a speech object returned by the search API. */
function extractDate(speech: Record<string, unknown>): string {
  // Nested debate/document object
  const debate = speech.debate ?? speech.document
  if (debate && typeof debate === "object") {
    const d = (debate as Record<string, unknown>).date
    if (typeof d === "string") return d
  }
  // Direct date field (some API variants)
  if (typeof speech.date === "string") return speech.date
  // Parse from URL pattern e.g. /debates/2024-11-20/ embedded in speech.url
  const url = typeof speech.url === "string" ? speech.url : ""
  const dateMatch = url.match(/\d{4}-\d{2}-\d{2}/)
  if (dateMatch) return dateMatch[0]
  return ""
}

/** Run a single search query against OpenParliament.ca and return matching mentions. */
async function searchParliament(query: string): Promise<ParliamentMention[]> {
  const url = `${OPENPARL_BASE}/search/?q=${encodeURIComponent(query)}&format=json&limit=20&sort=date`
  let res: Response
  try {
    res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "AICanadaPulse/1.0" },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return []
  } catch {
    return []
  }

  const json = await res.json()
  const objects: Record<string, unknown>[] = json.objects ?? []

  return objects.flatMap((speech) => {
    const contentEn = (speech.content as Record<string, string> | undefined)?.en ?? ""
    const textContent = contentEn.replace(/<[^>]+>/g, "")

    // Content relevance check — skip speeches that matched the query but are off-topic
    if (!AI_KEYWORDS.test(textContent)) return []

    const attribution = (speech.attribution as Record<string, string> | undefined)?.en ?? ""
    const { name, party } = parseAttribution(attribution)
    const h2 = (speech.h2 as Record<string, string> | undefined)?.en
    const h1 = (speech.h1 as Record<string, string> | undefined)?.en

    return [{
      url: `https://openparliament.ca${speech.url as string}`,
      date: extractDate(speech),
      speaker: name || "Unknown",
      party,
      topic: h2 || h1 || "House Debate",
      excerpt: extractAIExcerpt(textContent, 250),
    }]
  })
}

export async function fetchParliamentAIMentions(): Promise<ParliamentData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  try {
    // Run all search queries in parallel — searches across all of Hansard history
    const results = await Promise.allSettled(SEARCH_QUERIES.map(searchParliament))

    // Merge and deduplicate by URL, then sort newest-first
    const seen = new Set<string>()
    const allMentions: ParliamentMention[] = []

    for (const result of results) {
      if (result.status === "rejected") continue
      for (const mention of result.value) {
        if (!seen.has(mention.url)) {
          seen.add(mention.url)
          allMentions.push(mention)
        }
      }
    }

    allMentions.sort((a, b) => b.date.localeCompare(a.date))

    const data: ParliamentData = {
      mentions: allMentions.slice(0, 15),
      totalCount: allMentions.length,
    }

    cache = { data, fetchedAt: Date.now() }
    return data
  } catch (err) {
    console.warn("[parliament-client] Failed to fetch AI mentions:", err)
    return cache?.data ?? { mentions: [], totalCount: 0 }
  }
}

function parseAttribution(attr: string): { name: string; party: string } {
  // "Hon. John Smith (Riding, Lib.)" -> name="Hon. John Smith", party="Liberal"
  const match = attr.match(/^(.+?)\s*\(.*?,\s*(\w+)\.?\)$/)
  if (match) {
    const partyAbbr = match[2]
    const partyMap: Record<string, string> = {
      Lib: "Liberal",
      CPC: "Conservative",
      NDP: "NDP",
      BQ: "Bloc Québécois",
      GP: "Green",
      Ind: "Independent",
    }
    return { name: match[1].trim(), party: partyMap[partyAbbr] || partyAbbr }
  }
  // Fallback: just the name
  return { name: attr.replace(/\s*\(.*\)/, "").trim(), party: "" }
}

function truncateText(text: string, len: number): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= len) return clean
  return clean.slice(0, len).trimEnd() + "..."
}

/** Extract an excerpt centered around the first AI keyword match */
function extractAIExcerpt(text: string, len: number): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= len) return clean

  // Find the position of the first AI keyword match
  const match = clean.match(AI_KEYWORDS)
  if (!match || match.index === undefined) {
    return truncateText(clean, len)
  }

  const matchPos = match.index
  const halfWindow = Math.floor(len / 2)

  // Calculate start/end of the excerpt window
  let start = Math.max(0, matchPos - halfWindow)
  let end = Math.min(clean.length, start + len)

  // Adjust start if end hit the boundary
  if (end === clean.length) {
    start = Math.max(0, end - len)
  }

  let excerpt = clean.slice(start, end).trim()

  // Add ellipsis if truncated
  if (start > 0) excerpt = "..." + excerpt
  if (end < clean.length) excerpt = excerpt + "..."

  return excerpt
}

