import type { DataPoint, Indicator } from "./indicators-data"

const WDS_BASE = "https://www150.statcan.gc.ca/t1/wds/rest"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours — Stats Canada updates daily at 8:30 AM EST

// ─── Vector registry: maps indicator IDs to Stats Canada vector IDs ─────────
// Add more vectors here as you discover them via the WDS explorer.
// Use getDataFromVectorsAndLatestNPeriods with a known vectorId to verify.

interface VectorConfig {
  vectorId: number
  // how many monthly periods to fetch (50 ≈ Jan 2022 → Feb 2026)
  latestN: number
}

export const VECTOR_REGISTRY: Record<string, VectorConfig> = {
  unemployment: { vectorId: 2062815, latestN: 50 },  // LFS 14-10-0287, Canada 15+ SA
  "youth-unemployment": { vectorId: 2062842, latestN: 50 },  // LFS 14-10-0287, Canada 15-24 SA
  "participation-rate": { vectorId: 2062816, latestN: 50 },  // LFS 14-10-0287, Canada 15+ SA
  "employment-rate": { vectorId: 2062817, latestN: 50 },  // LFS 14-10-0287, Canada 15+ SA
  "cpi": { vectorId: 41690973, latestN: 50 },  // CPI 18-10-0004, Canada All-items
  "gdp": { vectorId: 65201210, latestN: 50 },  // GDP 36-10-0434, All industries, SA at annual rates, chained 2017 dollars
}

// ─── In-memory cache ────────────────────────────────────────────────────────

interface CacheEntry {
  data: DataPoint[]
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()

// ─── Fetch a single indicator from Stats Canada WDS ─────────────────────────

async function fetchVector(vectorId: number, latestN: number): Promise<DataPoint[] | null> {
  try {
    const res = await fetch(`${WDS_BASE}/getDataFromVectorsAndLatestNPeriods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ vectorId, latestN }]),
    })

    if (!res.ok) return null

    const json = await res.json()
    const result = json[0]
    if (result?.status !== "SUCCESS" || !result.object?.vectorDataPoint) return null

    const points: DataPoint[] = result.object.vectorDataPoint
      .map((dp: { refPer: string; value: number; scalarFactorCode: number }) => {
        const date = dp.refPer.slice(0, 7) // "2025-11-01" → "2025-11"
        // Use value as-is; scalarFactorCode describes the unit scale, not a multiplier
        return { date, value: Math.round(dp.value * 10) / 10 }
      })
      .sort((a: DataPoint, b: DataPoint) => a.date.localeCompare(b.date))

    return points.length > 0 ? points : null
  } catch (err) {
    console.warn(`[statscan-client] Failed to fetch vector ${vectorId}:`, err)
    return null
  }
}

// ─── Public: fetch indicator with cache ─────────────────────────────────────

export async function fetchIndicatorData(indicatorId: string): Promise<DataPoint[] | null> {
  const config = VECTOR_REGISTRY[indicatorId]
  if (!config) return null // no vector registered for this indicator

  // Check cache
  const cached = cache.get(indicatorId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data
  }

  // Fetch from Stats Canada
  const data = await fetchVector(config.vectorId, config.latestN)
  if (data) {
    cache.set(indicatorId, { data, fetchedAt: Date.now() })
  }

  return data
}

// ─── Public: fetch all indicators, merging live data with fallback ──────────

export async function fetchAllIndicators(fallback: Indicator[]): Promise<Indicator[]> {
  const results = await Promise.allSettled(
    fallback.map(async (ind) => {
      const liveData = await fetchIndicatorData(ind.id)
      if (liveData && liveData.length > 0) {
        return { ...ind, data: liveData }
      }
      return ind // use mock fallback
    })
  )

  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : fallback[i]
  )
}
