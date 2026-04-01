// OpenParliament.ca search scraper
// Tracks AI-related mentions in the federal House of Commons and committees.
// Source: https://openparliament.ca/search/
//
// The REST API (api.openparliament.ca) does not expose a JSON search endpoint.
// We fetch the structured HTML search results page and extract data from it.
// NOTE: Federal Parliament only — provincial/territorial legislatures not included.

const BASE = "https://openparliament.ca"
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

const MONTH_MAP: Record<string, string> = {
  January: '01', February: '02', March: '03', April: '04',
  May: '05', June: '06', July: '07', August: '08',
  September: '09', October: '10', November: '11', December: '12',
}

const PARTY_MAP: Record<string, string> = {
  liberal: 'Liberal',
  conservative: 'Conservative',
  ndp: 'NDP',
  bloc: 'Bloc Québécois',
  green: 'Green',
  independent: 'Independent',
}

// Queries run in parallel — covers English and French Hansard
const SEARCH_QUERIES = [
  'artificial intelligence',
  'intelligence artificielle',
  'machine learning',
]

function parseIsoDate(text: string): string {
  // "March 26th, 2026" → "2026-03-26"
  const match = text.match(/(\w+)\s+(\d+)[a-z]*,\s+(\d{4})/i)
  if (!match) return ''
  const month = MONTH_MAP[match[1]] ?? '00'
  return `${match[3]}-${month}-${match[2].padStart(2, '0')}`
}

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseSearchHtml(html: string): ParliamentMention[] {
  const mentions: ParliamentMention[] = []

  // Split on result blocks — each starts with <div class="row result"
  const blocks = html.split('<div class="row result"')
  for (const block of blocks.slice(1)) {
    // Speech URL
    const urlMatch = block.match(/data-url="([^"]+)"/)
    if (!urlMatch) continue
    const speechUrl = `${BASE}${urlMatch[1]}`

    // Topic (the linked heading in the main col)
    const topicMatch = block.match(/class="statement_topic"[^>]*>([^<]+)</)
    const topic = topicMatch ? decodeHtml(topicMatch[1]) : 'House Debate'

    // Excerpt — the text after &nbsp; in the main col paragraph, strip any inline tags
    const excerptMatch = block.match(/&nbsp;([\s\S]*?)<\/p>/)
    const rawExcerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]+>/g, '') : ''
    const excerpt = decodeHtml(rawExcerpt).slice(0, 300)

    // Speaker — pol_name link text (MPs) or <strong> text (non-MP witnesses)
    const speakerLinkMatch = block.match(/class="pol_name"[^>]*>([^<]+)</)
    const speakerBoldMatch = block.match(/<strong>([^<]+)<\/strong>/)
    const speaker = speakerLinkMatch
      ? speakerLinkMatch[1].trim()
      : speakerBoldMatch ? speakerBoldMatch[1].trim() : 'Unknown'

    // Party — from partytag_* class on the context badge
    const partyMatch = block.match(/class="tag partytag_(\w+)"/)
    const party = partyMatch ? (PARTY_MAP[partyMatch[1]] ?? partyMatch[1]) : ''

    // Date — first date-like string in the context col
    const dateTextMatch = block.match(/<p>([A-Z][a-z]+ \d+[a-z]*, \d{4})/)
    const date = dateTextMatch ? parseIsoDate(dateTextMatch[1]) : ''

    if (excerpt.length > 10) {
      mentions.push({ url: speechUrl, date, speaker, party, topic, excerpt })
    }
  }

  return mentions
}

async function searchParliament(query: string): Promise<ParliamentMention[]> {
  const url = `${BASE}/search/?q=${encodeURIComponent(query)}&sort=date+desc`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'AICanadaPulse/1.0 (open data research)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      console.warn(`[parliament-client] Search returned ${res.status} for "${query}"`)
      return []
    }
  } catch (err) {
    console.warn(`[parliament-client] Search fetch failed for "${query}":`, err)
    return []
  }

  const html = await res.text()
  return parseSearchHtml(html)
}

export async function fetchParliamentAIMentions(): Promise<ParliamentData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  try {
    // Parallel searches across English and French Hansard
    const results = await Promise.allSettled(SEARCH_QUERIES.map(searchParliament))

    // Merge and deduplicate by URL, then sort newest-first
    const seen = new Set<string>()
    const allMentions: ParliamentMention[] = []

    for (const result of results) {
      if (result.status === 'rejected') continue
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

    console.log(`[parliament-client] Found ${data.totalCount} unique AI mentions across all queries`)
    cache = { data, fetchedAt: Date.now() }
    return data
  } catch (err) {
    console.warn('[parliament-client] Failed:', err)
    return cache?.data ?? { mentions: [], totalCount: 0 }
  }
}
