// GDELT types for Canadian AI media sentiment

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
}
