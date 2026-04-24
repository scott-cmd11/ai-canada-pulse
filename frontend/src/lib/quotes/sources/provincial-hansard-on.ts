// Ontario Legislative Assembly Hansard search.
// OLA exposes a search UI at https://www.ola.org/en/legislative-business/house-documents/parliament-*/hansard
// and a newer unified search at https://www.ola.org/en/search?q=<query>&type=hansard.
//
// HTML parsing is bespoke — the OLA redesigns periodically, so this scraper
// is best-effort and guarded: on any parse failure we return [] rather than
// crashing the full ingest run.

import type { RawSourceCandidate } from "../types"

const SEARCH_URL = "https://www.ola.org/en/search?q=artificial+intelligence&type=hansard&sort=date&order=desc"

async function fetchHtml(): Promise<string | null> {
  try {
    const res = await fetch(SEARCH_URL, {
      headers: {
        "User-Agent": "AICanadaPulse/1.0 (open data research)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function decode(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export async function fetchOntarioHansardCandidates(): Promise<RawSourceCandidate[]> {
  const html = await fetchHtml()
  if (!html) return []

  const candidates: RawSourceCandidate[] = []
  // OLA search results are rendered as <article class="search-result"> or
  // <div class="views-row"> depending on template generation. Match both.
  const blocks = html.split(/<(?:article|div)\s+class="(?:search-result|views-row)[^"]*"[^>]*>/i).slice(1)

  for (const block of blocks.slice(0, 30)) {
    const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
    if (!linkMatch) continue
    const href = linkMatch[1].startsWith("http") ? linkMatch[1] : `https://www.ola.org${linkMatch[1]}`
    const title = decode(linkMatch[2])
    const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/)
    const snippet = snippetMatch ? decode(snippetMatch[1]) : ""
    const dateMatch = block.match(/\b(\d{4}-\d{2}-\d{2})\b/) ||
                      block.match(/\b(\w+ \d{1,2},\s+\d{4})\b/)

    if (title.length + snippet.length < 50) continue

    candidates.push({
      source_type: "provincial_hansard_on",
      source_url: href,
      jurisdiction: "on",
      rawText: `${title}\n\n${snippet}`,
      hintedChamber: "provincial_legislature",
      hintedDate: dateMatch?.[1],
    })
  }

  return candidates
}
