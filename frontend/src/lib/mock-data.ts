// Type definitions only — no mock data

export type Category = "Research" | "Policy & Regulation" | "Industry & Startups" | "Talent & Education" | "Global AI Race"
export type Sentiment = "positive" | "neutral" | "concerning"

export interface Story {
  id: string
  headline: string
  summary: string
  category: Category
  region: string
  publishedAt: string
  sentiment: Sentiment
  isBriefingTop: boolean
  sourceUrl?: string
  sourceName?: string
}

export interface PulseData {
  mood: "green" | "amber" | "red"
  moodLabel: string
  description: string
  updatedAt: string
}
