import { unstable_cache } from "next/cache"
import { parse } from "csv-parse/sync"
import type { AdoptionSourceHealth } from "@/lib/statcan-sdmx-client"

const CKAN_BASE = "https://open.canada.ca/data/api/3"
const CANADABUYS_PACKAGE_ID = "6abd20d4-7a1c-4b38-baa2-9525d0bb2fd2"
const CONTRACTS_PACKAGE_ID = "d8f85d91-7dec-4fd1-8055-483b77225d8b"
const CONTRACTS_RESOURCE_ID = "fac950c0-00d5-4ec1-a4d3-9cbebf98a305"
const CANADABUYS_DATASET_URL = `https://open.canada.ca/data/en/dataset/${CANADABUYS_PACKAGE_ID}`
const CONTRACTS_DATASET_URL = `https://open.canada.ca/data/en/dataset/${CONTRACTS_PACKAGE_ID}/resource/${CONTRACTS_RESOURCE_ID}`

export interface ProcurementDemandSignal {
  id: string
  kind: "tender" | "contract"
  title: string
  organization: string
  publishedAt: string | null
  closingAt: string | null
  value: number | null
  url: string
  categories: string[]
  sourceName: string
  sourceUrl: string
  description: string
}

export interface ProcurementDemandData {
  signals: ProcurementDemandSignal[]
  tenderCount: number
  contractSampleCount: number
  fetchedAt: string
  sourceHealth: AdoptionSourceHealth[]
}

interface CkanResource {
  id?: string
  name?: string
  format?: string
  url?: string
  last_modified?: string
  metadata_modified?: string
}

interface TenderRow {
  [key: string]: string | undefined
}

interface ContractRecord {
  _id?: number
  reference_number?: string
  procurement_id?: string
  vendor_name?: string
  contract_date?: string
  description_en?: string
  contract_value?: string
  comments_en?: string
  owner_org_title?: string
}

const KEYWORD_GROUPS = [
  { category: "Artificial intelligence", pattern: /\b(artificial intelligence|machine learning|generative ai|large language model|LLM|natural language processing|computer vision|neural network)\b/i },
  { category: "Automation", pattern: /\b(automation|automated|robotic process|workflow automation|chatbot|virtual assistant)\b/i },
  { category: "Cloud and data", pattern: /\b(cloud|data platform|data analytics|business intelligence|data science|analytics platform)\b/i },
  { category: "Cyber and identity", pattern: /\b(cybersecurity|identity management|biometric|fraud detection)\b/i },
]

function classify(text: string) {
  return KEYWORD_GROUPS.filter((group) => group.pattern.test(text)).map((group) => group.category)
}

function clean(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim()
}

function sourceHealth(id: string, label: string, sourceUrl: string, fetchedAt: string, resource?: CkanResource): AdoptionSourceHealth {
  return {
    id,
    label,
    status: resource?.url ? "live" : "unavailable",
    sourceUrl,
    fetchedAt,
    releaseTime: resource?.last_modified ?? resource?.metadata_modified ?? null,
    note: resource?.url ? undefined : "Open Canada did not return a usable resource.",
  }
}

async function packageResources(packageId: string): Promise<CkanResource[]> {
  const res = await fetch(`${CKAN_BASE}/action/package_show?id=${packageId}`, {
    headers: { "User-Agent": "AICanadaPulse/1.0 (open data research)" },
    next: { revalidate: 12 * 60 * 60 },
  })
  if (!res.ok) throw new Error(`Open Canada package_show ${packageId} returned ${res.status}`)
  const json = await res.json()
  return json.result?.resources ?? []
}

async function fetchTenderSignals(resource: CkanResource): Promise<ProcurementDemandSignal[]> {
  if (!resource.url) return []
  const res = await fetch(resource.url, {
    headers: {
      "User-Agent": "AICanadaPulse/1.0 (open data research)",
      Accept: "text/csv,*/*",
    },
    next: { revalidate: 6 * 60 * 60 },
  })
  if (!res.ok) throw new Error(`CanadaBuys CSV returned ${res.status}`)

  const text = await res.text()
  const rows = parse(text, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as TenderRow[]

  return rows
    .map((row, index) => {
      const title = clean(row["title-titre-eng"])
      const description = clean(row["tenderDescription-descriptionAppelOffres-eng"])
      const gsin = clean(row["gsinDescription-nibsDescription-eng"])
      const unspsc = clean(row["unspscDescription-eng"])
      const textForClassification = [title, description, gsin, unspsc].join(" ")
      const categories = classify(textForClassification)
      if (categories.length === 0) return null

      return {
        id: clean(row["referenceNumber-numeroReference"]) || `tender-${index}`,
        kind: "tender" as const,
        title,
        organization: clean(row["contractingEntityName-nomEntitContractante-eng"]) || "Government of Canada",
        publishedAt: clean(row["publicationDate-datePublication"]) || null,
        closingAt: clean(row["tenderClosingDate-appelOffresDateCloture"]) || null,
        value: null,
        url: clean(row["noticeURL-URLavis-eng"]) || CANADABUYS_DATASET_URL,
        categories,
        sourceName: "CanadaBuys tender notices",
        sourceUrl: CANADABUYS_DATASET_URL,
        description: description || gsin || unspsc,
      }
    })
    .filter(Boolean)
    .slice(0, 12) as ProcurementDemandSignal[]
}

async function fetchContractSignals(): Promise<ProcurementDemandSignal[]> {
  const params = new URLSearchParams({
    resource_id: CONTRACTS_RESOURCE_ID,
    limit: "250",
    sort: "contract_date desc",
  })
  const res = await fetch(`${CKAN_BASE}/action/datastore_search?${params}`, {
    headers: { "User-Agent": "AICanadaPulse/1.0 (open data research)" },
    next: { revalidate: 12 * 60 * 60 },
  })
  if (!res.ok) return []

  const json = await res.json()
  const records = (json.result?.records ?? []) as ContractRecord[]

  return records
    .map((record) => {
      const description = clean(record.description_en)
      const comments = clean(record.comments_en)
      const categories = classify(`${description} ${comments}`)
      if (categories.length === 0) return null

      return {
        id: record.reference_number || record.procurement_id || `contract-${record._id}`,
        kind: "contract" as const,
        title: description || "Contract over $10,000",
        organization: clean(record.owner_org_title) || "Government of Canada",
        publishedAt: clean(record.contract_date) || null,
        closingAt: null,
        value: Number(record.contract_value) || null,
        url: CONTRACTS_DATASET_URL,
        categories,
        sourceName: "Contracts over $10,000",
        sourceUrl: CONTRACTS_DATASET_URL,
        description: comments || description,
      }
    })
    .filter(Boolean)
    .slice(0, 8) as ProcurementDemandSignal[]
}

async function _fetchProcurementDemand(): Promise<ProcurementDemandData> {
  const fetchedAt = new Date().toISOString()
  try {
    if (process.env.AI_CANADA_FORCE_SOURCE_FALLBACK === "1") {
      throw new Error("Forced source fallback for verification")
    }

    const [canadaBuysResources, contractResources] = await Promise.all([
      packageResources(CANADABUYS_PACKAGE_ID),
      packageResources(CONTRACTS_PACKAGE_ID).catch(() => []),
    ])

    const openTenderResource =
      canadaBuysResources.find((resource) => resource.name === "Open tender notices" && resource.format?.toUpperCase() === "CSV") ??
      canadaBuysResources.find((resource) => resource.name === "New tender notices" && resource.format?.toUpperCase() === "CSV")
    const contractsResource = contractResources.find((resource) => resource.id === CONTRACTS_RESOURCE_ID)

    const [tenderSignals, contractSignals] = await Promise.all([
      openTenderResource ? fetchTenderSignals(openTenderResource).catch(() => []) : Promise.resolve([]),
      fetchContractSignals().catch(() => []),
    ])

    return {
      signals: [...tenderSignals, ...contractSignals],
      tenderCount: tenderSignals.length,
      contractSampleCount: contractSignals.length,
      fetchedAt,
      sourceHealth: [
        sourceHealth("canadabuys-tenders", "CanadaBuys tender notices", CANADABUYS_DATASET_URL, fetchedAt, openTenderResource),
        sourceHealth("contracts-over-10k", "Contracts over $10,000", CONTRACTS_DATASET_URL, fetchedAt, contractsResource),
      ],
    }
  } catch (err) {
    console.warn("[procurement-demand-client] Falling back to empty procurement demand data:", err)
    return {
      signals: [],
      tenderCount: 0,
      contractSampleCount: 0,
      fetchedAt,
      sourceHealth: [
        {
          id: "canadabuys-tenders",
          label: "CanadaBuys tender notices",
          status: "fallback",
          sourceUrl: CANADABUYS_DATASET_URL,
          fetchedAt,
          note: "CanadaBuys resource discovery failed; no tender demand signals are being claimed.",
        },
        {
          id: "contracts-over-10k",
          label: "Contracts over $10,000",
          status: "fallback",
          sourceUrl: CONTRACTS_DATASET_URL,
          fetchedAt,
          note: "Contracts sample failed; no contract demand signals are being claimed.",
        },
      ],
    }
  }
}

const fetchCachedProcurementDemand = unstable_cache(
  _fetchProcurementDemand,
  ["ai-procurement-demand-signals"],
  { revalidate: 6 * 60 * 60 }
)

export function fetchProcurementDemand(): Promise<ProcurementDemandData> {
  if (process.env.AI_CANADA_FORCE_SOURCE_FALLBACK === "1") {
    return _fetchProcurementDemand()
  }
  return fetchCachedProcurementDemand()
}
