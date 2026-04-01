#!/usr/bin/env node
/**
 * Job Bank CSV Refresh — GitHub Actions runner script
 *
 * Fetches the Government of Canada Job Bank monthly CSV, filters AI-related
 * job postings, aggregates stats, and writes to Upstash Redis.
 *
 * Runs daily via GitHub Actions, which has unrestricted access to open.canada.ca
 * (unlike Vercel's serverless functions which appear to block the domain).
 *
 * Required env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */

import { createRequire } from 'module'
import { Readable } from 'stream'

const require = createRequire(import.meta.url)
const { parse } = require('csv-parse')
const iconv = require('iconv-lite')

const CKAN_API = 'https://open.canada.ca/data/api/3/action/package_show?id=ea639e28-c0fc-48bf-b5dd-b8899bd43072'
const CACHE_KEY = 'jobbank-csv-stats'
const CACHE_TTL = 24 * 60 * 60 // 24 hours

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
  process.exit(1)
}

// AI keyword groups — must match frontend/src/lib/jobs-client.ts
const KEYWORD_GROUPS = [
  { term: 'artificial intelligence', keywords: ['artificial intelligence', 'ai engineer', 'ai developer', 'ai specialist'] },
  { term: 'machine learning', keywords: ['machine learning', 'ml engineer', 'mlops'] },
  { term: 'data scientist', keywords: ['data scientist', 'data science'] },
  { term: 'LLM / generative AI', keywords: ['llm', 'large language model', 'generative ai', 'gen ai'] },
  { term: 'NLP / computer vision', keywords: ['nlp', 'natural language', 'computer vision', 'deep learning', 'neural network'] },
]

const ALL_KEYWORDS = KEYWORD_GROUPS.flatMap(g => g.keywords)

function titleMatchesAI(title) {
  const t = title.toLowerCase()
  return ALL_KEYWORDS.some(kw => t.includes(kw))
}

function matchedTerms(title) {
  const t = title.toLowerCase()
  return KEYWORD_GROUPS
    .filter(g => g.keywords.some(kw => t.includes(kw)))
    .map(g => g.term)
}

function toAnnualSalary(min, max, per) {
  const lo = parseFloat(min)
  const hi = parseFloat(max)
  if (isNaN(lo) && isNaN(hi)) return null
  const mid = isNaN(lo) ? hi : isNaN(hi) ? lo : (lo + hi) / 2
  const perLower = (per ?? '').toLowerCase()
  if (perLower.includes('hour')) return Math.round(mid * 2080)
  if (perLower.includes('year') || perLower.includes('annual')) return Math.round(mid)
  return null
}

const PROVINCE_MAP = {
  'Ontario': 'Ontario', 'Quebec': 'Quebec', 'British Columbia': 'British Columbia',
  'Alberta': 'Alberta', 'Manitoba': 'Manitoba', 'Saskatchewan': 'Saskatchewan',
  'Nova Scotia': 'Nova Scotia', 'New Brunswick': 'New Brunswick',
  'Newfoundland and Labrador': 'Newfoundland and Labrador',
  'Prince Edward Island': 'Prince Edward Island',
  'Northwest Territories': 'Northwest Territories', 'Nunavut': 'Nunavut', 'Yukon': 'Yukon',
}

function normalizeProvince(raw) {
  const p = (raw ?? '').trim()
  return PROVINCE_MAP[p] ?? p
}

async function discoverCsvUrl() {
  console.log('Discovering CSV URL via CKAN API...')
  const res = await fetch(CKAN_API, {
    redirect: 'follow',
    headers: { 'User-Agent': 'AICanadaPulse/1.0 (open data research)' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`CKAN API returned ${res.status}`)
  const data = await res.json()
  const resources = data?.result?.resources ?? []
  const enCSVs = resources.filter(r => r.url.includes('-en-') && r.url.endsWith('.csv'))
  if (!enCSVs[0]) throw new Error('No English CSV found in CKAN response')
  console.log(`Found ${enCSVs.length} English CSVs: ${enCSVs[0].url}`)
  return enCSVs[0].url
}

async function parseCsvStats(csvUrl) {
  console.log(`Fetching CSV: ${csvUrl}`)
  const res = await fetch(csvUrl, {
    redirect: 'follow',
    headers: { 'User-Agent': 'AICanadaPulse/1.0 (open data research)' },
    signal: AbortSignal.timeout(120_000), // 2 min for 39MB CSV
  })
  if (!res.ok || !res.body) throw new Error(`CSV fetch returned ${res.status}`)

  console.log('Streaming and parsing CSV...')

  const reader = res.body.getReader()
  const nodeStream = new Readable({
    async read() {
      const { done, value } = await reader.read()
      if (done) this.push(null)
      else this.push(Buffer.from(value))
    },
  })

  return new Promise((resolve, reject) => {
    let totalVacancies = 0
    let rowCount = 0
    const termCounts = {}
    const provinceCounts = {}
    const salaries = []

    const parser = parse({ columns: true, skip_empty_lines: true, relax_column_count: true })

    parser.on('readable', () => {
      let row
      while ((row = parser.read()) !== null) {
        rowCount++
        const title = row['Job Title'] ?? ''
        if (!titleMatchesAI(title)) continue

        const vacancies = parseInt(row['Vacancy Count'] ?? '1') || 1
        totalVacancies += vacancies

        const prov = normalizeProvince(row['Province/Territory'] ?? '')
        if (prov) provinceCounts[prov] = (provinceCounts[prov] ?? 0) + vacancies

        for (const term of matchedTerms(title)) {
          termCounts[term] = (termCounts[term] ?? 0) + vacancies
        }

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
      console.log(`Parsed ${rowCount.toLocaleString()} rows, found ${totalVacancies} AI vacancies`)
      const avgSalary = salaries.length > 0
        ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
        : null

      const topLocations = Object.entries(provinceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([location, count]) => ({ location, count }))

      const searchTerms = KEYWORD_GROUPS.map(g => ({
        term: g.term,
        count: termCounts[g.term] ?? 0,
      })).sort((a, b) => b.count - a.count)

      resolve({ totalAIJobs: totalVacancies, averageSalary: avgSalary, topCategories: [], topLocations, sampleJobs: [], searchTerms })
    })

    parser.on('error', reject)
    // The Job Bank CSV is UTF-16 LE encoded (BOM \xff\xfe) — decode to UTF-8 before parsing
    nodeStream.pipe(iconv.decodeStream('utf-16le')).pipe(parser)
  })
}

async function writeToRedis(data) {
  const value = JSON.stringify(data)
  // Upstash REST API: SET key value EX seconds
  const res = await fetch(`${UPSTASH_URL}/set/${CACHE_KEY}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([value, 'EX', CACHE_TTL]),
  })
  if (!res.ok) throw new Error(`Redis write failed: ${res.status}`)
  console.log('Wrote stats to Upstash Redis')
}

async function main() {
  const csvUrl = await discoverCsvUrl()

  // Extract month from URL for dataMonth field
  const monthMatch = csvUrl.match(/-en-([a-z]+)(\d{4})\.csv$/i)
  const dataMonth = monthMatch
    ? `${monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1)} ${monthMatch[2]}`
    : undefined

  const stats = await parseCsvStats(csvUrl)
  if (!stats || stats.totalAIJobs === 0) {
    throw new Error('CSV parse returned no AI job results')
  }

  const result = { ...stats, source: 'jobbank-csv', dataMonth }
  console.log(`Stats: ${result.totalAIJobs} vacancies, avg salary ${result.averageSalary}, month: ${dataMonth}`)

  await writeToRedis(result)
  console.log('Done.')
}

main().catch(err => {
  console.error('Job Bank refresh failed:', err)
  process.exit(1)
})
