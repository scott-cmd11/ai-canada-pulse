import { unstable_cache } from "next/cache"
import { parse } from "csv-parse/sync"
import type { AdoptionSourceHealth } from "@/lib/statcan-sdmx-client"

const CKAN_BASE = "https://open.canada.ca/data/api/3"
const AI_REGISTER_PACKAGE_ID = "fcbc0200-79ba-4fa4-94a6-00e32facea6b"
const AI_REGISTER_DATASET_URL = `https://open.canada.ca/data/en/dataset/${AI_REGISTER_PACKAGE_ID}`

export interface GovAISystem {
  id: string
  title: string
  department: string
  status: string
  primaryUsers: string
  developedBy: string
  vendor: string | null
  capabilities: string
  description: string
  url: string | null
  datePublished: string | null
  involvesPersonalInformation: boolean | null
  notification: boolean | null
}

export interface GovAIRegistryData {
  systems: GovAISystem[]
  total: number
  inProduction: number
  inDevelopment: number
  retired: number
  publicFacing: number
  employeeFacing: number
  sourceUrl: string
  resourceUrl: string | null
  resourceName: string | null
  fetchedAt: string
  sourceHealth: AdoptionSourceHealth[]
}

interface CkanResource {
  name?: string
  format?: string
  url?: string
  last_modified?: string
  metadata_modified?: string
}

interface CkanPackageResponse {
  result?: {
    resources?: CkanResource[]
    date_modified?: string
  }
}

interface RawRegisterRow {
  ai_register_id?: string
  name_ai_system_en?: string
  government_organization?: string
  description_ai_system_en?: string
  ai_system_primary_users_en?: string
  developed_by_en?: string
  vendor_information?: string
  ai_system_status_en?: string
  status_date?: string
  ai_system_capabilities_en?: string
  involves_personal_information?: string
  notification_ai?: string
  ai_system_results_en?: string
}

function yn(value?: string): boolean | null {
  if (!value) return null
  if (value.trim().toUpperCase() === "Y") return true
  if (value.trim().toUpperCase() === "N") return false
  return null
}

function clean(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim()
}

function truncate(value: string, length: number) {
  if (value.length <= length) return value
  return `${value.slice(0, length).trimEnd()}...`
}

async function discoverRegisterCsv(): Promise<CkanResource | null> {
  const res = await fetch(`${CKAN_BASE}/action/package_show?id=${AI_REGISTER_PACKAGE_ID}`, {
    headers: { "User-Agent": "AICanadaPulse/1.0 (open data research)" },
    next: { revalidate: 12 * 60 * 60 },
  })

  if (!res.ok) {
    throw new Error(`Open Canada package_show returned ${res.status}`)
  }

  const json = (await res.json()) as CkanPackageResponse
  const resources = json.result?.resources ?? []
  return resources.find((resource) => resource.format?.toUpperCase() === "CSV" && resource.url) ?? null
}

async function _fetchGovAIRegistry(): Promise<GovAIRegistryData> {
  const fetchedAt = new Date().toISOString()
  try {
    if (process.env.AI_CANADA_FORCE_SOURCE_FALLBACK === "1") {
      throw new Error("Forced source fallback for verification")
    }

    const resource = await discoverRegisterCsv()

    if (!resource?.url) {
      throw new Error("GC AI Register CSV resource was not found")
    }

    const res = await fetch(resource.url, {
      headers: { "User-Agent": "AICanadaPulse/1.0 (open data research)" },
      next: { revalidate: 12 * 60 * 60 },
    })

    if (!res.ok) {
      throw new Error(`GC AI Register CSV returned ${res.status}`)
    }

    const text = await res.text()
    const rows = parse(text, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    }) as RawRegisterRow[]

    const systems = rows
      .map((row) => {
        const id = clean(row.ai_register_id)
        const title = clean(row.name_ai_system_en)
        const description = clean(row.description_ai_system_en || row.ai_system_results_en)
        if (!id || !title) return null
        return {
          id,
          title,
          department: clean(row.government_organization) || "Government of Canada",
          status: clean(row.ai_system_status_en) || "Unknown",
          primaryUsers: clean(row.ai_system_primary_users_en) || "Not specified",
          developedBy: clean(row.developed_by_en) || "Not specified",
          vendor: clean(row.vendor_information) || null,
          capabilities: clean(row.ai_system_capabilities_en) || "Not specified",
          description: truncate(description, 260),
          url: AI_REGISTER_DATASET_URL,
          datePublished: clean(row.status_date) || null,
          involvesPersonalInformation: yn(row.involves_personal_information),
          notification: yn(row.notification_ai),
        }
      })
      .filter(Boolean) as GovAISystem[]

    const inProduction = systems.filter((system) => system.status.toLowerCase().includes("production")).length
    const inDevelopment = systems.filter((system) => system.status.toLowerCase().includes("development")).length
    const retired = systems.filter((system) => system.status.toLowerCase().includes("retired")).length
    const publicFacing = systems.filter((system) => system.primaryUsers.toLowerCase().includes("public")).length
    const employeeFacing = systems.filter((system) => system.primaryUsers.toLowerCase().includes("employee")).length

    return {
      systems,
      total: systems.length,
      inProduction,
      inDevelopment,
      retired,
      publicFacing,
      employeeFacing,
      sourceUrl: AI_REGISTER_DATASET_URL,
      resourceUrl: resource.url,
      resourceName: resource.name ?? null,
      fetchedAt,
      sourceHealth: [
        {
          id: "gc-ai-register",
          label: "Government of Canada AI Register",
          status: "live",
          sourceUrl: AI_REGISTER_DATASET_URL,
          fetchedAt,
          releaseTime: resource.last_modified ?? resource.metadata_modified ?? null,
        },
      ],
    }
  } catch (err) {
    console.warn("[gov-ai-registry-client] Falling back to empty register data:", err)
    return {
      systems: [],
      total: 0,
      inProduction: 0,
      inDevelopment: 0,
      retired: 0,
      publicFacing: 0,
      employeeFacing: 0,
      sourceUrl: AI_REGISTER_DATASET_URL,
      resourceUrl: null,
      resourceName: null,
      fetchedAt,
      sourceHealth: [
        {
          id: "gc-ai-register",
          label: "Government of Canada AI Register",
          status: "fallback",
          sourceUrl: AI_REGISTER_DATASET_URL,
          fetchedAt,
          note: "Open Canada CKAN resource was unavailable; no system entries are being claimed.",
        },
      ],
    }
  }
}

const fetchCachedGovAIRegistry = unstable_cache(
  _fetchGovAIRegistry,
  ["gc-ai-register-dynamic-csv"],
  { revalidate: 12 * 60 * 60 }
)

export function fetchGovAIRegistry(): Promise<GovAIRegistryData> {
  if (process.env.AI_CANADA_FORCE_SOURCE_FALLBACK === "1") {
    return _fetchGovAIRegistry()
  }
  return fetchCachedGovAIRegistry()
}
