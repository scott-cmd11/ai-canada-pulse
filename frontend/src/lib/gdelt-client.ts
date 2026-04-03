// GDELT types for Canadian AI media sentiment
// NOTE: GDELT API is no longer used. The /api/v1/sentiment route was rewritten to
// derive sentiment from the RSS story feed (rss-client.ts) due to frequent GDELT unavailability.
// This file is retained for type compatibility with SentimentSection.tsx.
// Source (original): https://api.gdeltproject.org/api/v2/doc/doc (now unused)

export interface GdeltArticle {
  url: string
  title: string
  source: string
  domain: string
  language: string
  seenDate: string
  tone: number
  socialImage: string | null
}

export interface SentimentData {
  articles: GdeltArticle[]
  averageTone: number
  sentimentLabel: "positive" | "neutral" | "negative"
  toneDistribution: { positive: number; neutral: number; negative: number }
  topSources: Array<{ source: string; count: number }>
  total: number
  scannedAt: string
}
