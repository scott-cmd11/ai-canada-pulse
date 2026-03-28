// OpenParliament.ca API client
// Tracks AI-related mentions in House of Commons debates
// Source: OpenParliament.ca — https://api.openparliament.ca/
// Data originates from Hansard (official transcripts), bilingual (EN + FR).
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

// Bilingual keyword filter — Parliament debates are in both English and French.
// French equivalents added for key terms to capture Hansard entries in either official language.
const AI_KEYWORDS = /artificial intelligence|machine learning|generative ai|aida|algorithmic|deep learning|large language model|chatgpt|openai|AI\s+regulation|AI\s+act|intelligence artificielle|apprentissage automatique|apprentissage profond|modèle de langage|IA générative|réglementation.*IA|loi.*IA/i

export async function fetchParliamentAIMentions(): Promise<ParliamentData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  try {
    // Step 1: Get recent debate dates
    const debatesRes = await fetch(`${OPENPARL_BASE}/debates/?format=json&limit=10`, {
      headers: { "Accept": "application/json", "User-Agent": "AICanadaPulse/1.0" },
      signal: AbortSignal.timeout(10_000),
    })
    if (!debatesRes.ok) return cache?.data ?? { mentions: [], totalCount: 0 }

    const debatesJson = await debatesRes.json()
    const debates: Array<{ date: string; url: string }> = debatesJson.objects ?? []

    // Step 2: For each recent debate, fetch speeches and search for AI mentions
    const allMentions: ParliamentMention[] = []

    // Check up to 5 recent debates
    for (const debate of debates.slice(0, 5)) {
      const speechesUrl = `${OPENPARL_BASE}/speeches/?document=${encodeURIComponent(debate.url)}&format=json&limit=100`
      const speechesRes = await fetch(speechesUrl, {
        headers: { "Accept": "application/json", "User-Agent": "AICanadaPulse/1.0" },
        signal: AbortSignal.timeout(8_000),
      })
      if (!speechesRes.ok) continue

      const speechesJson = await speechesRes.json()
      const speeches = speechesJson.objects ?? []

      for (const speech of speeches) {
        const contentEn = speech.content?.en || ""
        const textContent = contentEn.replace(/<[^>]+>/g, "")

        if (AI_KEYWORDS.test(textContent)) {
          const attribution = speech.attribution?.en || ""
          const { name, party } = parseAttribution(attribution)

          allMentions.push({
            url: `https://openparliament.ca${speech.url}`,
            date: debate.date,
            speaker: name || "Unknown",
            party,
            topic: speech.h2?.en || speech.h1?.en || "House Debate",
            excerpt: extractAIExcerpt(textContent, 250),
          })
        }
      }
    }

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

