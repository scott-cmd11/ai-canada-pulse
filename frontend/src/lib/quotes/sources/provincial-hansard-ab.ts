// Alberta Legislative Assembly Hansard.
// Alberta publishes Hansard transcripts at:
//   https://www.assembly.ab.ca/assembly-business/transcripts/hansard-documents
// Each day's transcript is HTML or PDF. We scrape the recent-days listing
// and look for AI-relevant paragraphs in the HTML variants.

import type { RawSourceCandidate } from "../types"

const LIST_URL = "https://www.assembly.ab.ca/assembly-business/transcripts/hansard-documents"
const AI_HINT = /\b(artificial intelligence|machine learning|generative ai|foundation model|LLM|AIDA|algorithmic)\b/i

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AICanadaPulse/1.0 (open data research)" },
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
    .replace(/\s+/g, " ")
    .trim()
}

function findRecentTranscripts(listHtml: string): string[] {
  // Hansard links on assembly.ab.ca point at /documents/hansard-<id> or /han-<date>.html
  const matches = Array.from(listHtml.matchAll(/href="([^"]*(?:hansard|han-)[^"]*\.html?)"/gi))
  const links = new Set<string>()
  for (const m of matches) {
    const href = m[1]
    const abs = href.startsWith("http") ? href : `https://www.assembly.ab.ca${href.startsWith("/") ? "" : "/"}${href}`
    links.add(abs)
    if (links.size >= 5) break
  }
  return Array.from(links)
}

function extractAISnippets(transcriptHtml: string, sourceUrl: string): RawSourceCandidate[] {
  const body = transcriptHtml
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
  const paragraphs = body.split(/<\/?p[^>]*>/i).map(decode).filter((p) => p.length > 80)

  const candidates: RawSourceCandidate[] = []
  for (const p of paragraphs) {
    if (!AI_HINT.test(p)) continue
    candidates.push({
      source_type: "provincial_hansard_ab",
      source_url: sourceUrl,
      jurisdiction: "ab",
      rawText: p.slice(0, 1800),
      hintedChamber: "provincial_legislature",
    })
    if (candidates.length >= 15) break
  }
  return candidates
}

export async function fetchAlbertaHansardCandidates(): Promise<RawSourceCandidate[]> {
  const listHtml = await fetchHtml(LIST_URL)
  if (!listHtml) return []

  const transcripts = findRecentTranscripts(listHtml)
  if (transcripts.length === 0) return []

  const htmls = await Promise.allSettled(transcripts.slice(0, 3).map(fetchHtml))
  const all: RawSourceCandidate[] = []
  htmls.forEach((result, i) => {
    if (result.status !== "fulfilled" || !result.value) return
    all.push(...extractAISnippets(result.value, transcripts[i]))
  })
  return all
}
