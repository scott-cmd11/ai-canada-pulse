// Curated fallback only. Live adoption surfaces should use /api/v1/adoption,
// backed by Statistics Canada WDS tables in statcan-sdmx-client.ts.

export interface AdoptionDataPoint {
  sector: string
  percentage: number
  source: string
  sourceUrl: string
  tableId: string
  year: number
  quarter?: string
  status: "fallback"
}

export const privateSectorAdoption: AdoptionDataPoint[] = [
  {
    sector: "Information and cultural industries",
    percentage: 35.6,
    source: "Statistics Canada",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3310100401",
    tableId: "33-10-1004-01",
    year: 2025,
    quarter: "Q2",
    status: "fallback",
  },
  {
    sector: "Professional, scientific and technical services",
    percentage: 31.7,
    source: "Statistics Canada",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3310100401",
    tableId: "33-10-1004-01",
    year: 2025,
    quarter: "Q2",
    status: "fallback",
  },
  {
    sector: "Finance and insurance",
    percentage: 30.6,
    source: "Statistics Canada",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3310100401",
    tableId: "33-10-1004-01",
    year: 2025,
    quarter: "Q2",
    status: "fallback",
  },
]

export const overallComparison = {
  privateSector: {
    label: "Private sector",
    adoptionRate: 12.2,
    source: "Statistics Canada, Table 33-10-1004-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3310100401",
    year: 2025,
    quarter: "Q2",
    status: "fallback" as const,
    note: "Fallback value only; live surfaces use /api/v1/adoption.",
  },
  publicSector: {
    label: "Federal public sector",
    adoptionRate: null,
    source: "Government of Canada AI Register",
    sourceUrl: "https://open.canada.ca/data/en/dataset/fcbc0200-79ba-4fa4-94a6-00e32facea6b",
    year: 2026,
    status: "live-source-required" as const,
    note: "The federal register counts systems, not a department adoption rate.",
  },
}
