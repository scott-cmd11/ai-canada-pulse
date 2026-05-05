import { unstable_cache } from "next/cache"

const WDS_BASE = "https://www150.statcan.gc.ca/t1/wds/rest"
const STATCAN_ADOPTION_SOURCE_URL =
  "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3310100401"

export type SourceFreshnessStatus = "live" | "fallback" | "manual" | "unavailable"

export interface IndustryAdoption {
  industry: string
  adoptionRate: number
  tableId: string
  sourceUrl: string
  vectorId?: number
}

export interface AdoptionMetric {
  label: string
  value: number
  unit: "%"
  tableId: string
  sourceUrl: string
  vectorId?: number
}

export interface AdoptionSourceHealth {
  id: string
  label: string
  status: SourceFreshnessStatus
  tableId?: string
  sourceUrl: string
  fetchedAt: string
  releaseTime?: string | null
  note?: string
}

export interface StatCanAdoptionData {
  industries: IndustryAdoption[]
  averageRate: number
  surveyPeriod: string
  fetchedAt: string
  isLive: boolean
  isFallback: boolean
  sourceUrl: string
  actualNationalRate: AdoptionMetric
  plannedNationalRate: AdoptionMetric
  employmentImpact: AdoptionMetric[]
  operationalChanges: AdoptionMetric[]
  sourceHealth: AdoptionSourceHealth[]
}

interface WdsResponse {
  status: string
  object?: {
    productId: number
    coordinate: string
    vectorId?: number
    vectorDataPoint?: Array<{
      value: number | string
      releaseTime?: string
    }>
  }
}

interface WdsRequestSpec {
  key: string
  productId: number
  coordinate: string
  label: string
  sourceUrl: string
}

const TABLES = {
  actualUse: {
    id: "33101004",
    pid: 33101004,
    period: "Q2 2025",
    sourceUrl: STATCAN_ADOPTION_SOURCE_URL,
  },
  plannedUse: {
    id: "33101045",
    pid: 33101045,
    period: "Q3 2025",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3310104501",
  },
  employmentImpact: {
    id: "33101047",
    pid: 33101047,
    period: "Q3 2025",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3310104701",
  },
  operationalChanges: {
    id: "33101048",
    pid: 33101048,
    period: "Q3 2025",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3310104801",
  },
} as const

const INDUSTRY_MEMBERS = [
  { memberId: 9, label: "Information and cultural industries" },
  { memberId: 12, label: "Professional, scientific and technical services" },
  { memberId: 10, label: "Finance and insurance" },
  { memberId: 6, label: "Wholesale trade" },
  { memberId: 5, label: "Manufacturing" },
  { memberId: 7, label: "Retail trade" },
  { memberId: 8, label: "Transportation and warehousing" },
  { memberId: 14, label: "Health care and social assistance" },
]

const EMPLOYMENT_MEMBERS = [
  { memberId: 1, label: "Expected employment increase" },
  { memberId: 2, label: "Expected employment decrease" },
  { memberId: 3, label: "Expected no employment change" },
  { memberId: 4, label: "Employment impact unknown" },
]

const OPERATIONAL_CHANGE_MEMBERS = [
  { memberId: 1, label: "Train current staff" },
  { memberId: 6, label: "Develop new workflows" },
  { memberId: 4, label: "Purchase cloud services or storage" },
  { memberId: 5, label: "Change data collection or management" },
  { memberId: 7, label: "Use vendors or consulting services" },
  { memberId: 3, label: "Purchase computing power or equipment" },
  { memberId: 2, label: "Hire staff trained in AI" },
  { memberId: 10, label: "No operational change" },
]

const FALLBACK_INDUSTRIES: IndustryAdoption[] = [
  { industry: "Information and cultural industries", adoptionRate: 35.6, tableId: TABLES.actualUse.id, sourceUrl: TABLES.actualUse.sourceUrl },
  { industry: "Professional, scientific and technical services", adoptionRate: 31.7, tableId: TABLES.actualUse.id, sourceUrl: TABLES.actualUse.sourceUrl },
  { industry: "Finance and insurance", adoptionRate: 30.6, tableId: TABLES.actualUse.id, sourceUrl: TABLES.actualUse.sourceUrl },
  { industry: "Wholesale trade", adoptionRate: 17.8, tableId: TABLES.actualUse.id, sourceUrl: TABLES.actualUse.sourceUrl },
  { industry: "Manufacturing", adoptionRate: 15.2, tableId: TABLES.actualUse.id, sourceUrl: TABLES.actualUse.sourceUrl },
  { industry: "Retail trade", adoptionRate: 8.4, tableId: TABLES.actualUse.id, sourceUrl: TABLES.actualUse.sourceUrl },
  { industry: "Transportation and warehousing", adoptionRate: 7.1, tableId: TABLES.actualUse.id, sourceUrl: TABLES.actualUse.sourceUrl },
  { industry: "Health care and social assistance", adoptionRate: 5.8, tableId: TABLES.actualUse.id, sourceUrl: TABLES.actualUse.sourceUrl },
]

function coordinate(businessMemberId: number, measureMemberId: number) {
  return `1.${businessMemberId}.${measureMemberId}.0.0.0.0.0.0.0`
}

function metricFromResponse(spec: WdsRequestSpec, response: WdsResponse): AdoptionMetric | null {
  const point = response.object?.vectorDataPoint?.[0]
  const value = typeof point?.value === "number" ? point.value : Number(point?.value)
  if (!Number.isFinite(value)) return null
  return {
    label: spec.label,
    value: Math.round(value * 10) / 10,
    unit: "%",
    tableId: String(spec.productId),
    sourceUrl: spec.sourceUrl,
    vectorId: response.object?.vectorId,
  }
}

function buildRequests(): WdsRequestSpec[] {
  return [
    { key: "actual-national", productId: TABLES.actualUse.pid, coordinate: coordinate(1, 1), label: "Businesses using AI", sourceUrl: TABLES.actualUse.sourceUrl },
    { key: "planned-national", productId: TABLES.plannedUse.pid, coordinate: coordinate(1, 1), label: "Businesses planning AI use", sourceUrl: TABLES.plannedUse.sourceUrl },
    ...INDUSTRY_MEMBERS.map((member) => ({
      key: `industry-${member.memberId}`,
      productId: TABLES.actualUse.pid,
      coordinate: coordinate(member.memberId, 1),
      label: member.label,
      sourceUrl: TABLES.actualUse.sourceUrl,
    })),
    ...EMPLOYMENT_MEMBERS.map((member) => ({
      key: `employment-${member.memberId}`,
      productId: TABLES.employmentImpact.pid,
      coordinate: coordinate(1, member.memberId),
      label: member.label,
      sourceUrl: TABLES.employmentImpact.sourceUrl,
    })),
    ...OPERATIONAL_CHANGE_MEMBERS.map((member) => ({
      key: `operations-${member.memberId}`,
      productId: TABLES.operationalChanges.pid,
      coordinate: coordinate(1, member.memberId),
      label: member.label,
      sourceUrl: TABLES.operationalChanges.sourceUrl,
    })),
  ]
}

async function fetchWdsMetrics(specs: WdsRequestSpec[]) {
  const res = await fetch(`${WDS_BASE}/getDataFromCubePidCoordAndLatestNPeriods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "AICanadaPulse/1.0 (open data research)",
    },
    body: JSON.stringify(specs.map(({ productId, coordinate }) => ({ productId, coordinate, latestN: 1 }))),
    next: { revalidate: 6 * 60 * 60 },
  })

  if (!res.ok) {
    throw new Error(`Statistics Canada WDS returned ${res.status}`)
  }

  const json = (await res.json()) as WdsResponse[]
  return new Map(
    json.map((response, index) => [specs[index]?.key, { spec: specs[index], response }])
  )
}

function fallbackData(reason: string): StatCanAdoptionData {
  const fetchedAt = new Date().toISOString()
  return {
    industries: FALLBACK_INDUSTRIES,
    averageRate: Math.round((FALLBACK_INDUSTRIES.reduce((sum, i) => sum + i.adoptionRate, 0) / FALLBACK_INDUSTRIES.length) * 10) / 10,
    surveyPeriod: TABLES.actualUse.period,
    fetchedAt,
    isLive: false,
    isFallback: true,
    sourceUrl: TABLES.actualUse.sourceUrl,
    actualNationalRate: {
      label: "Businesses using AI",
      value: 12.2,
      unit: "%",
      tableId: TABLES.actualUse.id,
      sourceUrl: TABLES.actualUse.sourceUrl,
    },
    plannedNationalRate: {
      label: "Businesses planning AI use",
      value: 14.5,
      unit: "%",
      tableId: TABLES.plannedUse.id,
      sourceUrl: TABLES.plannedUse.sourceUrl,
    },
    employmentImpact: [
      { label: "Expected employment increase", value: 7.3, unit: "%", tableId: TABLES.employmentImpact.id, sourceUrl: TABLES.employmentImpact.sourceUrl },
      { label: "Expected employment decrease", value: 12.2, unit: "%", tableId: TABLES.employmentImpact.id, sourceUrl: TABLES.employmentImpact.sourceUrl },
      { label: "Expected no employment change", value: 69.9, unit: "%", tableId: TABLES.employmentImpact.id, sourceUrl: TABLES.employmentImpact.sourceUrl },
    ],
    operationalChanges: [
      { label: "Train current staff", value: 49.8, unit: "%", tableId: TABLES.operationalChanges.id, sourceUrl: TABLES.operationalChanges.sourceUrl },
      { label: "Develop new workflows", value: 41.9, unit: "%", tableId: TABLES.operationalChanges.id, sourceUrl: TABLES.operationalChanges.sourceUrl },
      { label: "Purchase cloud services or storage", value: 27.0, unit: "%", tableId: TABLES.operationalChanges.id, sourceUrl: TABLES.operationalChanges.sourceUrl },
    ],
    sourceHealth: [
      {
        id: "statcan-ai-adoption",
        label: "Statistics Canada AI adoption tables",
        status: "fallback",
        tableId: TABLES.actualUse.id,
        sourceUrl: TABLES.actualUse.sourceUrl,
        fetchedAt,
        note: reason,
      },
    ],
  }
}

async function _fetchStatCanAdoption(): Promise<StatCanAdoptionData> {
  const fetchedAt = new Date().toISOString()

  try {
    if (process.env.AI_CANADA_FORCE_SOURCE_FALLBACK === "1") {
      throw new Error("Forced source fallback for verification")
    }

    const specs = buildRequests()
    const results = await fetchWdsMetrics(specs)

    const getMetric = (key: string) => {
      const entry = results.get(key)
      if (!entry?.spec) return null
      return metricFromResponse(entry.spec, entry.response)
    }

    const industries = INDUSTRY_MEMBERS.map((member) => {
      const metric = getMetric(`industry-${member.memberId}`)
      if (!metric) return null
      return {
        industry: member.label,
        adoptionRate: metric.value,
        tableId: metric.tableId,
        sourceUrl: metric.sourceUrl,
        vectorId: metric.vectorId,
      }
    }).filter(Boolean) as IndustryAdoption[]

    const actualNationalRate = getMetric("actual-national")
    const plannedNationalRate = getMetric("planned-national")

    if (!actualNationalRate || !plannedNationalRate || industries.length === 0) {
      return fallbackData("Statistics Canada returned an incomplete adoption table response.")
    }

    const employmentImpact = EMPLOYMENT_MEMBERS
      .map((member) => getMetric(`employment-${member.memberId}`))
      .filter(Boolean) as AdoptionMetric[]

    const operationalChanges = OPERATIONAL_CHANGE_MEMBERS
      .map((member) => getMetric(`operations-${member.memberId}`))
      .filter(Boolean) as AdoptionMetric[]

    const releaseTimes = Array.from(results.values())
      .map(({ response }) => response.object?.vectorDataPoint?.[0]?.releaseTime)
      .filter(Boolean) as string[]

    return {
      industries,
      averageRate: Math.round((industries.reduce((sum, i) => sum + i.adoptionRate, 0) / industries.length) * 10) / 10,
      surveyPeriod: TABLES.actualUse.period,
      fetchedAt,
      isLive: true,
      isFallback: false,
      sourceUrl: TABLES.actualUse.sourceUrl,
      actualNationalRate,
      plannedNationalRate,
      employmentImpact,
      operationalChanges,
      sourceHealth: [
        {
          id: "statcan-ai-adoption",
          label: "Statistics Canada AI adoption tables",
          status: "live",
          tableId: TABLES.actualUse.id,
          sourceUrl: TABLES.actualUse.sourceUrl,
          fetchedAt,
          releaseTime: releaseTimes.sort().at(-1) ?? null,
        },
      ],
    }
  } catch (err) {
    console.warn("[statcan-sdmx-client] Falling back to curated AI adoption values:", err)
    return fallbackData("Statistics Canada WDS was unavailable; showing the last curated values.")
  }
}

const fetchCachedStatCanAdoption = unstable_cache(
  _fetchStatCanAdoption,
  ["statcan-ai-adoption-official-tables"],
  { revalidate: 6 * 60 * 60 }
)

export function fetchStatCanAdoption(): Promise<StatCanAdoptionData> {
  if (process.env.AI_CANADA_FORCE_SOURCE_FALLBACK === "1") {
    return _fetchStatCanAdoption()
  }
  return fetchCachedStatCanAdoption()
}
