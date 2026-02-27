// Google Trends client for Canadian AI search interest
// Uses google-trends-api npm package (server-side only, no API key needed)

// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api")

const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

export interface TrendsData {
  dates: string[]
  series: { keyword: string; values: number[] }[]
}

interface CacheEntry {
  data: TrendsData
  fetchedAt: number
}

let cache: CacheEntry | null = null

interface TimelineDataPoint {
  time: string
  formattedTime: string
  value: number[]
}

export async function fetchAITrendsCanada(): Promise<TrendsData | null> {
  // Check cache
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  try {
    const startTime = new Date()
    startTime.setFullYear(startTime.getFullYear() - 1)

    const keywords = ["artificial intelligence", "ChatGPT", "machine learning"]

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

    const data: TrendsData = { dates, series }
    cache = { data, fetchedAt: Date.now() }
    return data
  } catch (err) {
    console.warn("[trends-client] Failed to fetch Google Trends data:", err)
    return null
  }
}
