// canada.ca news releases — ministerial statements mentioning AI.
// Uses the Canada.ca news RSS feed (stable, well-formed XML).
// Docs: https://www.canada.ca/en/news.atom.xml

import type { RawSourceCandidate } from "../types"

const FEEDS = [
  "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofindustry&type=newsreleases&sort=publishedDate&orderBy=desc&publishedDate%3E=now-90d&pick=50&format=atom&atomtitle=Canada%20News%20Centre",
  "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentoffinancecanada&type=newsreleases&sort=publishedDate&orderBy=desc&publishedDate%3E=now-90d&pick=50&format=atom&atomtitle=Canada%20News%20Centre",
  "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofjustice&type=newsreleases&sort=publishedDate&orderBy=desc&publishedDate%3E=now-90d&pick=50&format=atom&atomtitle=Canada%20News%20Centre",
  "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=privycouncil&type=newsreleases&sort=publishedDate&orderBy=desc&publishedDate%3E=now-90d&pick=50&format=atom&atomtitle=Canada%20News%20Centre",
  "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=treasuryboardofcanadasecretariat&type=newsreleases&sort=publishedDate&orderBy=desc&publishedDate%3E=now-90d&pick=50&format=atom&atomtitle=Canada%20News%20Centre",
]

const AI_HINT = /\b(artificial intelligence|intelligence artificielle|machine learning|AI|IA|AIDA|generative|foundation model|LLM)\b/i

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function extractEntries(xml: string): Array<{ title: string; link: string; summary: string; date: string }> {
  const entries: Array<{ title: string; link: string; summary: string; date: string }> = []
  const blocks = xml.split(/<entry[\s>]/).slice(1)
  for (const block of blocks) {
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)
    const linkMatch = block.match(/<link[^>]*href="([^"]+)"/)
    const summaryMatch = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || block.match(/<content[^>]*>([\s\S]*?)<\/content>/)
    const dateMatch = block.match(/<(?:updated|published)[^>]*>([^<]+)</)
    if (!titleMatch || !linkMatch) continue
    entries.push({
      title: decodeXml(titleMatch[1]),
      link: linkMatch[1].trim(),
      summary: decodeXml(summaryMatch?.[1] ?? ""),
      date: (dateMatch?.[1] ?? "").slice(0, 10),
    })
  }
  return entries
}

async function fetchFeed(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AICanadaPulse/1.0 (open data research)" },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export async function fetchCanadaNewsCandidates(): Promise<RawSourceCandidate[]> {
  const feeds = await Promise.allSettled(FEEDS.map(fetchFeed))
  const candidates: RawSourceCandidate[] = []

  for (const result of feeds) {
    if (result.status !== "fulfilled" || !result.value) continue
    const entries = extractEntries(result.value)
    for (const entry of entries) {
      const combined = `${entry.title}\n\n${entry.summary}`
      if (!AI_HINT.test(combined)) continue
      candidates.push({
        source_type: "canada_news",
        source_url: entry.link,
        jurisdiction: "federal",
        rawText: combined,
        hintedChamber: "executive",
        hintedDate: entry.date || undefined,
      })
    }
  }

  return candidates
}
