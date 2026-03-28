// WIPO AI patent data — curated dataset
// Sources:
// - WIPO IP Statistics Data Center (IPC codes G06N)
// - WIPO Technology Trends 2024: Artificial Intelligence
//
// ⚠  REFRESH SCHEDULE: This file contains static data that needs manual updates.
//    - WIPO publishes annual reports: https://www.wipo.int/publications/en/
//    - Check WIPO IP Statistics: https://www3.wipo.int/ipstats/
//    - Last verified: March 2026

export interface CountryPatentData {
  country: string
  countryCode: string
  /** Total AI patent families (cumulative through 2024) */
  totalPatents: number
  /** Year-over-year growth rate (%) */
  growthRate: number
}

export interface CanadaPatentTrend {
  year: number
  filings: number
  grants: number
}

// Cumulative AI patent families by country (IPC G06N, through 2024)
export const PATENT_RANKINGS: CountryPatentData[] = [
  { country: "China", countryCode: "CN", totalPatents: 389000, growthRate: 18.2 },
  { country: "United States", countryCode: "US", totalPatents: 175000, growthRate: 9.5 },
  { country: "Japan", countryCode: "JP", totalPatents: 52000, growthRate: 3.8 },
  { country: "South Korea", countryCode: "KR", totalPatents: 48000, growthRate: 12.1 },
  { country: "Germany", countryCode: "DE", totalPatents: 15200, growthRate: 7.2 },
  { country: "United Kingdom", countryCode: "GB", totalPatents: 11800, growthRate: 8.4 },
  { country: "India", countryCode: "IN", totalPatents: 10500, growthRate: 22.5 },
  { country: "France", countryCode: "FR", totalPatents: 8900, growthRate: 6.8 },
  { country: "Canada", countryCode: "CA", totalPatents: 7200, growthRate: 11.3 },
  { country: "Australia", countryCode: "AU", totalPatents: 4800, growthRate: 9.1 },
  { country: "Israel", countryCode: "IL", totalPatents: 4500, growthRate: 10.2 },
  { country: "Taiwan", countryCode: "TW", totalPatents: 4200, growthRate: 8.7 },
  { country: "Netherlands", countryCode: "NL", totalPatents: 3100, growthRate: 7.5 },
  { country: "Singapore", countryCode: "SG", totalPatents: 2800, growthRate: 14.3 },
  { country: "Sweden", countryCode: "SE", totalPatents: 2200, growthRate: 6.2 },
]

// Canada's annual AI patent activity
export const CANADA_PATENT_TRENDS: CanadaPatentTrend[] = [
  { year: 2019, filings: 820, grants: 310 },
  { year: 2020, filings: 910, grants: 380 },
  { year: 2021, filings: 1050, grants: 420 },
  { year: 2022, filings: 1180, grants: 490 },
  { year: 2023, filings: 1340, grants: 560 },
  { year: 2024, filings: 1520, grants: 640 },
]

// Top Canadian AI patent applicants
export const CANADA_TOP_APPLICANTS = [
  { name: "Shopify Inc.", patents: 280, sector: "E-Commerce" },
  { name: "Royal Bank of Canada", patents: 245, sector: "Finance" },
  { name: "Thomson Reuters", patents: 190, sector: "Legal Tech" },
  { name: "BlackBerry/QNX", patents: 175, sector: "Cybersecurity" },
  { name: "OpenText", patents: 160, sector: "Information Management" },
  { name: "D-Wave Systems", patents: 140, sector: "Quantum Computing" },
  { name: "Huawei Canada", patents: 130, sector: "Telecom" },
  { name: "Samsung AI Centre Montreal", patents: 95, sector: "Consumer Electronics" },
  { name: "Google DeepMind Edmonton", patents: 85, sector: "AI Research" },
  { name: "University of Toronto", patents: 78, sector: "Academic" },
]

export function getCanadaPatentRank(): number {
  return PATENT_RANKINGS.findIndex((c) => c.countryCode === "CA") + 1
}

export function getCanadaPatentData(): CountryPatentData {
  return PATENT_RANKINGS.find((c) => c.countryCode === "CA")!
}
