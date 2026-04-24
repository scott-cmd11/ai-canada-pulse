// British Columbia Legislative Assembly Hansard.
// BC's Hansard is transcript-per-sitting with no JSON search API.
// Listing page: https://www.leg.bc.ca/documents-data/debates-transcripts
// We scrape the recent transcripts list and pull the latest sitting's HTML,
// then pattern-match for AI-related passages.

import type { RawSourceCandidate } from "../types"

const LIST_URL = "https://www.leg.bc.ca/documents-data/debates-transcripts"
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

function findRecentTranscriptLinks(listHtml: string): string[] {
  // Transcript links look like /documents-data/debates-transcripts/42nd-parliament/5th-session/20260312pm-Hansard
  const matches = Array.from(listHtml.matchAll(/href="(\/documents-data\/debates-transcripts\/[^"]+Hansard[^"]*)"/gi))
  const links = new Set<string>()
  for (const m of matches) {
    links.add(`https://www.leg.bc.ca${m[1]}`)
    if (links.size >= 5) break
  }
  return Array.from(links)
}

function extractAISnippets(transcriptHtml: string, sourceUrl: string): RawSourceCandidate[] {
  // Split transcript by paragraphs. Keep paragraphs mentioning AI.
  const body = transcriptHtml
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
  const paragraphs = body.split(/<\/?p[^>]*>/i).map(decode).filter((p) => p.length > 80)

  const candidates: RawSourceCandidate[] = []
  for (const p of paragraphs) {
    if (!AI_HINT.test(p)) continue
    candidates.push({
      source_type: "provincial_hansard_bc",
      source_url: sourceUrl,
      jurisdiction: "bc",
      rawText: p.slice(0, 1800),
      hintedChamber: "provincial_legislature",
    })
    if (candidates.length >= 15) break
  }
  return candidates
}

export async function fetchBritishColumbiaHansardCandidates(): Promise<RawSourceCandidate[]> {
  const listHtml = await fetchHtml(LIST_URL)
  if (!listHtml) return []

  const transcriptLinks = findRecentTranscriptLinks(listHtml)
  if (transcriptLinks.length === 0) return []

  const transcriptHtmls = await Promise.allSettled(transcriptLinks.slice(0, 3).map(fetchHtml))
  const all: RawSourceCandidate[] = []

  transcriptHtmls.forEach((result, i) => {
    if (result.status !== "fulfilled" || !result.value) return
    all.push(...extractAISnippets(result.value, transcriptLinks[i]))
  })

  return all
}
