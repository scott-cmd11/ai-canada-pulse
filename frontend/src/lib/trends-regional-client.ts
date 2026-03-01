/**
 * Google Trends Regional Client
 * Fetches AI search interest by Canadian province/territory.
 */

import { unstable_cache } from "next/cache"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api")

export interface ProvinceInterest {
    name: string
    code: string
    value: number
}

export interface TrendsRegionalData {
    provinces: ProvinceInterest[]
    fetchedAt: string
}

async function _fetchRegionalInterest(): Promise<TrendsRegionalData> {
    try {
        const startTime = new Date()
        startTime.setFullYear(startTime.getFullYear() - 1)

        const result = await googleTrends.interestByRegion({
            keyword: "artificial intelligence",
            geo: "CA",
            startTime,
            resolution: "PROVINCE",
        })

        const parsed = JSON.parse(result)
        const geoData = parsed?.default?.geoMapData || []

        const provinces: ProvinceInterest[] = geoData
            .map((item: { geoName?: string; geoCode?: string; value?: number[] }) => ({
                name: item.geoName || "",
                code: (item.geoCode || "").replace("CA-", ""),
                value: item.value?.[0] ?? 0,
            }))
            .filter((p: ProvinceInterest) => p.value > 0)
            .sort((a: ProvinceInterest, b: ProvinceInterest) => b.value - a.value)

        return { provinces, fetchedAt: new Date().toISOString() }
    } catch (err) {
        console.warn("[trends-regional] Failed:", err)
        return { provinces: [], fetchedAt: new Date().toISOString() }
    }
}

export const fetchRegionalInterest = unstable_cache(
    _fetchRegionalInterest,
    ["google-trends-regional-ai"],
    { revalidate: 21600 } // 6 hours
)
