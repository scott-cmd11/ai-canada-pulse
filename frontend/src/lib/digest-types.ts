// frontend/src/lib/digest-types.ts
// Shared types for the daily digest and deep-dive blog posts.
// Both DailyDigest and DeepDive use the same tag union so the /blog
// index can filter across both content types without type casting.

export type DigestTag =
  | 'Policy'
  | 'Research'
  | 'Funding'
  | 'Markets'
  | 'Regulation'
  | 'Talent'

export interface DailyDigest {
  date: string           // ISO date: "2026-03-28"
  headline: string       // 1 punchy sentence
  intro: string          // 2–3 sentence narrative paragraph
  developments: {
    text: string         // 1–2 sentence bullet
    tag: DigestTag
  }[]                    // 3–5 items
  tags: DigestTag[]      // unique tags derived from developments
  topStories: {
    headline: string
    url: string
    source: string
  }[]                    // max 3
  deepDiveSlug?: string  // set if a deep-dive was generated today
  generatedAt: string    // ISO timestamp
  error?: true           // sentinel: only ever set to true; cron ran but generation failed
}

export interface DeepDive {
  slug: string
  title: string
  body: string           // 400–600 words markdown
  tags: DigestTag[]
  sources: { headline: string; url: string; source: string }[]
  triggeredBy: string    // e.g. "Funding round ≥ $50M: Cohere Series D"
  readingTimeMinutes: number
  generatedAt: string    // ISO timestamp
  date: string           // ISO date for archive display
}

// Lightweight summary stored in the deepdive:index sorted set value
export interface DeepDiveIndexEntry {
  slug: string
  title: string
  tags: DigestTag[]
  date: string
  triggeredBy: string
  readingTimeMinutes: number
}
