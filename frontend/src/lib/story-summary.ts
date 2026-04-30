import type { Story } from "@/lib/mock-data"

function normalize(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim()
}

export function isSummaryRedundant(headline: string, summary: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()
  const h = norm(headline)
  const s = norm(summary)

  if (s.length < 20) return true
  if (s.startsWith(h) || h.startsWith(s)) return true

  const hWords = h.split(/\s+/)
  const sWords = s.split(/\s+/)
  const sWordSet = new Set(sWords)
  let overlap = 0
  hWords.forEach((word) => {
    if (sWordSet.has(word)) overlap++
  })
  const allWords = new Set(hWords.concat(sWords))
  return allWords.size > 0 && overlap / allWords.size > 0.6
}

export function fallbackStorySummary(story: Story): string {
  const source = story.sourceName ? ` from ${story.sourceName}` : ""
  const region = story.region && story.region !== "Canada" ? ` in ${story.region}` : " across Canada"
  const category = story.category.toLowerCase()

  return `A ${category} signal${source}${region} is worth tracking: ${story.headline}`
}

export function getDisplaySummary(story: Story): { text: string; isAi: boolean } {
  const aiSummary = normalize(story.aiSummary)
  if (aiSummary) return { text: aiSummary, isAi: true }

  const sourceSummary = normalize(story.summary)
  if (sourceSummary && !isSummaryRedundant(story.headline, sourceSummary)) {
    return { text: sourceSummary, isAi: false }
  }

  return { text: fallbackStorySummary(story), isAi: false }
}
