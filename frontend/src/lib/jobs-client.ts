// Adzuna API client for Canadian AI job market data
// Docs: https://developer.adzuna.com/
// Requires ADZUNA_APP_ID and ADZUNA_APP_KEY env vars

const ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs/ca"
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

export interface JobMarketData {
  totalAIJobs: number
  averageSalary: number | null
  topCategories: Array<{ category: string; count: number }>
  topLocations: Array<{ location: string; count: number }>
  sampleJobs: Array<{
    title: string
    company: string
    location: string
    salary: string | null
    url: string
    created: string
  }>
  searchTerms: Array<{ term: string; count: number }>
}

interface CacheEntry {
  data: JobMarketData
  fetchedAt: number
}

let cache: CacheEntry | null = null

const AI_SEARCH_QUERIES = [
  "artificial intelligence",
  "machine learning",
  "LLM",
  "generative AI",
  "data scientist",
]

export async function fetchAIJobMarket(): Promise<JobMarketData | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  if (!appId || !appKey) {
    return null
  }

  try {
    const searchTermCounts: Array<{ term: string; count: number }> = []
    let totalJobs = 0
    let salarySum = 0
    let salaryCount = 0
    const locationCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}
    const sampleJobs: JobMarketData["sampleJobs"] = []

    for (const query of AI_SEARCH_QUERIES) {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        what: query,
        results_per_page: "10",
        content_type: "application/json",
        sort_by: "date",
      })

      const res = await fetch(`${ADZUNA_BASE}/search/1?${params}`, {
        headers: { "User-Agent": "AICanadaPulse/1.0" },
      })

      if (!res.ok) continue

      const json = await res.json()
      const count = json.count ?? 0
      searchTermCounts.push({ term: query, count })
      totalJobs += count

      for (const job of json.results ?? []) {
        // Salary tracking
        if (job.salary_min || job.salary_max) {
          const avg = ((job.salary_min || 0) + (job.salary_max || 0)) / 2
          if (avg > 0) {
            salarySum += avg
            salaryCount++
          }
        }

        // Location
        const loc = job.location?.display_name || "Unknown"
        locationCounts[loc] = (locationCounts[loc] || 0) + 1

        // Category
        const cat = job.category?.label || "Other"
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1

        // Sample jobs (collect up to 8 total)
        if (sampleJobs.length < 8) {
          const salaryStr = job.salary_min
            ? `$${Math.round(job.salary_min / 1000)}k–$${Math.round((job.salary_max || job.salary_min) / 1000)}k`
            : null
          sampleJobs.push({
            title: job.title || "Untitled",
            company: job.company?.display_name || "Unknown",
            location: loc,
            salary: salaryStr,
            url: job.redirect_url || "",
            created: job.created || "",
          })
        }
      }
    }

    const data: JobMarketData = {
      totalAIJobs: totalJobs,
      averageSalary: salaryCount > 0 ? Math.round(salarySum / salaryCount) : null,
      topCategories: Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([category, count]) => ({ category, count })),
      topLocations: Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([location, count]) => ({ location, count })),
      sampleJobs,
      searchTerms: searchTermCounts,
    }

    cache = { data, fetchedAt: Date.now() }
    return data
  } catch {
    return cache?.data ?? null
  }
}
