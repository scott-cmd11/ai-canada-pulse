// Assemblée nationale du Québec — Journal des débats (French + occasional English).
// Search UI: https://www.assnat.qc.ca/fr/recherche/recherche-avancee.html
// RSS/public feeds are limited; we use the public search page.

import type { RawSourceCandidate } from "../types"

const SEARCH_URLS = [
  "https://www.assnat.qc.ca/fr/recherche/recherche-simple.html?Section=enregistrement&Auteur=&Expressions=intelligence+artificielle&Phrase=&UnMot=&AucunMot=&DateDebut=&DateFin=",
  "https://www.assnat.qc.ca/fr/recherche/recherche-simple.html?Section=enregistrement&Auteur=&Expressions=apprentissage+automatique&Phrase=&UnMot=&AucunMot=&DateDebut=&DateFin=",
]

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

async function fetchOne(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "AICanadaPulse/1.0 (open data research)",
        "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export async function fetchQuebecHansardCandidates(): Promise<RawSourceCandidate[]> {
  const pages = await Promise.allSettled(SEARCH_URLS.map(fetchOne))
  const candidates: RawSourceCandidate[] = []
  const seen = new Set<string>()

  for (const page of pages) {
    if (page.status !== "fulfilled" || !page.value) continue
    const html = page.value

    // Results on assnat.qc.ca are rendered inside <li class="resultat"> or <div class="result">.
    const blocks = html.split(/<(?:li|div)\s+class="(?:resultat|result)[^"]*"[^>]*>/i).slice(1)

    for (const block of blocks.slice(0, 30)) {
      const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
      if (!linkMatch) continue
      const href = linkMatch[1].startsWith("http") ? linkMatch[1] : `https://www.assnat.qc.ca${linkMatch[1]}`
      if (seen.has(href)) continue
      seen.add(href)

      const title = decode(linkMatch[2])
      const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/)
      const snippet = snippetMatch ? decode(snippetMatch[1]) : ""
      const dateMatch = block.match(/\b(\d{4}-\d{2}-\d{2})\b/)

      if (title.length + snippet.length < 50) continue

      candidates.push({
        source_type: "provincial_hansard_qc",
        source_url: href,
        jurisdiction: "qc",
        rawText: `${title}\n\n${snippet}`,
        hintedChamber: "provincial_legislature",
        hintedDate: dateMatch?.[1],
      })
    }
  }

  return candidates
}
