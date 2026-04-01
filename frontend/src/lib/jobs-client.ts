// Canadian AI job market data via Government of Canada Job Bank open data
// Source: https://open.canada.ca/data/en/dataset/ea639e28-c0fc-48bf-b5dd-b8899bd43072
// Monthly CSV — no API key, no auth. Cached in Redis for 24h.

import { Redis } from '@upstash/redis'
import { parse } from 'csv-parse'
import { Readable } from 'stream'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const DATASET_ID = 'ea639e28-c0fc-48bf-b5dd-b8899bd43072'
const CKAN_API = `https://open.canada.ca/data/api/3/action/package_show?id=${DATASET_ID}`
const CACHE_TTL = 24 * 60 * 60 // 24 hours
const FETCH_TIMEOUT_MS = 60_000

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
  source?: 'jobbank-csv' | 'fallback'
  dataMonth?: string // e.g. "February 2026"
}

// AI keyword groups — each group maps to a display term
const KEYWORD_GROUPS: Array<{ term: string; keywords: string[] }> = [
  { term: 'artificial intelligence', keywords: ['artificial intelligence', 'ai engineer', 'ai developer', 'ai specialist'] },
  { term: 'machine learning', keywords: ['machine learning', 'ml engineer', 'mlops'] },
  { term: 'data scientist', keywords: ['data scientist', 'data science'] },
  { term: 'LLM / generative AI', keywords: ['llm', 'large language model', 'generative ai', 'gen ai'] },
  { term: 'NLP / computer vision', keywords: ['nlp', 'natural language', 'computer vision', 'deep learning', 'neural network'] },
]

const ALL_KEYWORDS = KEYWORD_GROUPS.flatMap((g) => g.keywords)

function titleMatchesAI(title: string): boolean {
  const t = title.toLowerCase()
  return ALL_KEYWORDS.some((kw) => t.includes(kw))
}

function matchedTerms(title: string): string[] {
  const t = title.toLowerCase()
  return KEYWORD_GROUPS
    .filter((g) => g.keywords.some((kw) => t.includes(kw)))
    .map((g) => g.term)
}

function toAnnualSalary(min: string, max: string, per: string): number | null {
  const lo = parseFloat(min)
  const hi = parseFloat(max)
  if (isNaN(lo) && isNaN(hi)) return null
  const mid = isNaN(lo) ? hi : isNaN(hi) ? lo : (lo + hi) / 2
  const perLower = (per ?? '').toLowerCase()
  if (perLower.includes('hour')) return Math.round(mid * 2080)
  if (perLower.includes('year') || perLower.includes('annual')) return Math.round(mid)
  return null
}

function normalizeProvince(raw: string): string {
  const p = (raw ?? '').trim()
  const map: Record<string, string> = {
    'Ontario': 'Ontario',
    'Quebec': 'Quebec',
    'British Columbia': 'British Columbia',
    'Alberta': 'Alberta',
    'Manitoba': 'Manitoba',
    'Saskatchewan': 'Saskatchewan',
    'Nova Scotia': 'Nova Scotia',
    'New Brunswick': 'New Brunswick',
    'Newfoundland and Labrador': 'Newfoundland and Labrador',
    'Prince Edward Island': 'Prince Edward Island',
    'Northwest Territories': 'Northwest Territories',
    'Nunavut': 'Nunavut',
    'Yukon': 'Yukon',
  }
  return map[p] ?? p
}

/** Discover latest English CSV URL via CKAN API. Returns null on failure. */
async function discoverCsvUrl(): Promise<{ url: string; name: string } | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    const res = await fetch(CKAN_API, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AICanadaPulse/1.0 (open data research)' },
    })
    clearTimeout(timer)
    if (!res.ok) {
      console.warn(`[jobs-client] CKAN API returned ${res.status}`)
      return null
    }
    const data = await res.json()
    const resources: Array<{ url: string; name: string }> = data?.result?.resources ?? []
    const enCSVs = resources.filter(
      (r) => r.url.includes('-en-') && r.url.endsWith('.csv')
    )
    console.log(`[jobs-client] Discovered ${enCSVs.length} English CSVs, using: ${enCSVs[0]?.url}`)
    return enCSVs[0] ?? null
  } catch (err) {
    console.warn('[jobs-client] CKAN API discovery failed:', err)
    return null
  }
}

/** Stream and parse the CSV, returning aggregated stats. */
async function parseCsvStats(csvUrl: string): Promise<Omit<JobMarketData, 'source'> | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(csvUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AICanadaPulse/1.0 (open data research)' },
    })
    clearTimeout(timer)
    if (!res.ok || !res.body) {
      console.warn(`[jobs-client] CSV fetch returned ${res.status} for ${csvUrl}`)
      return null
    }
  } catch (err) {
    clearTimeout(timer)
    console.warn('[jobs-client] CSV fetch failed:', err)
    return null
  }

  // Convert web stream to Node stream
  const reader = res.body.getReader()
  const nodeStream = new Readable({
    async read() {
      const { done, value } = await reader.read()
      if (done) this.push(null)
      else this.push(Buffer.from(value))
    },
  })

  return new Promise((resolve) => {
    let totalVacancies = 0
    const termCounts: Record<string, number> = {}
    const provinceCounts: Record<string, number> = {}
    const salaries: number[] = []

    const parser = parse({ columns: true, skip_empty_lines: true, relax_column_count: true })

    parser.on('readable', () => {
      let row: Record<string, string>
      while ((row = parser.read()) !== null) {
        const title = row['Job Title'] ?? ''
        if (!titleMatchesAI(title)) continue

        const vacancies = parseInt(row['Vacancy Count'] ?? '1') || 1
        totalVacancies += vacancies

        // Province
        const prov = normalizeProvince(row['Province/Territory'] ?? '')
        if (prov) provinceCounts[prov] = (provinceCounts[prov] ?? 0) + vacancies

        // Search term matching
        for (const term of matchedTerms(title)) {
          termCounts[term] = (termCounts[term] ?? 0) + vacancies
        }

        // Salary
        const annual = toAnnualSalary(
          row['Salary Minimum'] ?? '',
          row['Salary Maximum'] ?? '',
          row['Salary Per'] ?? ''
        )
        if (annual !== null && annual >= 30_000 && annual <= 500_000) {
          salaries.push(annual)
        }
      }
    })

    parser.on('end', () => {
      const avgSalary =
        salaries.length > 0
          ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
          : null

      const topLocations = Object.entries(provinceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([location, count]) => ({ location, count }))

      const searchTerms = KEYWORD_GROUPS.map((g) => ({
        term: g.term,
        count: termCounts[g.term] ?? 0,
      })).sort((a, b) => b.count - a.count)

      resolve({
        totalAIJobs: totalVacancies,
        averageSalary: avgSalary,
        topCategories: [],
        topLocations,
        sampleJobs: [],
        searchTerms,
      })
    })

    parser.on('error', () => resolve(null))
    nodeStream.pipe(parser)
  })
}

async function _fetchAIJobMarket(province?: string): Promise<JobMarketData | null> {
  const cacheKey = province
    ? `jobbank-csv-stats:province:${province}`
    : 'jobbank-csv-stats'

  // Check Redis cache first
  try {
    const cached = await redis.get<JobMarketData>(cacheKey)
    if (cached) return cached
  } catch {
    // Redis miss — continue to fetch
  }

  const resource = await discoverCsvUrl()
  if (!resource) {
    console.warn('[jobs-client] Could not discover Job Bank CSV URL — using fallback')
    return getFallbackData()
  }

  // Extract month label from filename e.g. "job-bank-open-data-all-job-postings-en-feb2026.csv"
  const monthMatch = resource.url.match(/-en-([a-z]+)(\d{4})\.csv$/i)
  const dataMonth = monthMatch
    ? `${monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1)} ${monthMatch[2]}`
    : undefined

  const stats = await parseCsvStats(resource.url)
  if (!stats || stats.totalAIJobs === 0) {
    console.warn('[jobs-client] CSV parse returned no results — using fallback')
    return getFallbackData()
  }

  // Filter by province if requested
  let result: JobMarketData = {
    ...stats,
    source: 'jobbank-csv',
    dataMonth,
  }

  if (province) {
    const provNorm = normalizeProvince(province)
    const provLocation = result.topLocations.find(
      (l) => l.location.toLowerCase().includes(provNorm.toLowerCase())
    )
    // Narrow counts proportionally if province specified
    if (provLocation && result.totalAIJobs > 0) {
      const ratio = provLocation.count / result.totalAIJobs
      result = {
        ...result,
        totalAIJobs: provLocation.count,
        topLocations: [provLocation],
        searchTerms: result.searchTerms.map((t) => ({
          ...t,
          count: Math.round(t.count * ratio),
        })),
      }
    }
  }

  // Cache result
  try {
    await redis.set(cacheKey, result, { ex: CACHE_TTL })
  } catch {
    // Cache write failure is non-fatal
  }

  return result
}

function getFallbackData(): JobMarketData {
  return {
    totalAIJobs: 15800,
    averageSalary: 105000,
    topCategories: [
      { category: 'Machine Learning Engineer', count: 42 },
      { category: 'Data Scientist', count: 38 },
      { category: 'AI Research', count: 22 },
      { category: 'NLP / LLM Engineer', count: 18 },
      { category: 'Computer Vision', count: 12 },
    ],
    topLocations: [
      { location: 'Ontario', count: 45 },
      { location: 'Quebec', count: 32 },
      { location: 'British Columbia', count: 18 },
      { location: 'Alberta', count: 14 },
      { location: 'Manitoba', count: 4 },
    ],
    sampleJobs: [],
    searchTerms: [
      { term: 'artificial intelligence', count: 4200 },
      { term: 'machine learning', count: 3800 },
      { term: 'data scientist', count: 3200 },
      { term: 'LLM / generative AI', count: 2100 },
      { term: 'NLP / computer vision', count: 2500 },
    ],
    source: 'fallback',
  }
}

export function fetchAIJobMarket(province?: string): Promise<JobMarketData | null> {
  return _fetchAIJobMarket(province)
}
