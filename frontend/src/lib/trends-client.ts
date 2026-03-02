// Google Trends client for Canadian AI tool adoption
// Tracks specific AI product search interest from Jan 2022 → present

import { unstable_cache } from "next/cache"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api")

export interface TrendsData {
  dates: string[]
  series: { keyword: string; values: number[] }[]
}

interface TimelineDataPoint {
  time: string
  formattedTime: string
  value: number[]
}

async function _fetchAITrendsCanada(): Promise<TrendsData | null> {
  try {
    const startTime = new Date("2022-01-01")

    const keywords = ["ChatGPT", "GitHub Copilot", "Midjourney", "Claude AI"]

    const result = await googleTrends.interestOverTime({
      keyword: keywords,
      geo: "CA",
      startTime,
    })

    const parsed = JSON.parse(result)
    const timeline: TimelineDataPoint[] = parsed?.default?.timelineData || []

    if (timeline.length === 0) return null

    const dates = timeline.map((point: TimelineDataPoint) => {
      const d = new Date(parseInt(point.time) * 1000)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    })

    const series = keywords.map((keyword: string, index: number) => ({
      keyword,
      values: timeline.map((point: TimelineDataPoint) => point.value[index] ?? 0),
    }))

    return { dates, series }
  } catch (err) {
    console.warn("[trends-client] Failed to fetch Google Trends data:", err)
    return null
  }
}

export const fetchAITrendsCanada = unstable_cache(
  _fetchAITrendsCanada,
  ["google-trends-canada-ai-tools-2022"],
  { revalidate: 21600 } // 6 hours
)
