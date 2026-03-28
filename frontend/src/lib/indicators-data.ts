export interface DataPoint {
  date: string // "YYYY-MM"
  value: number
}

export interface Indicator {
  id: string
  title: string
  unit: string
  color: string
  description: string
  frequency?: "monthly" | "quarterly" | "annual"
  source: string
  sourceLabel: string
  sourceUrl?: string
  data: DataPoint[]
}

// Only indicators with confirmed live Stats Canada vector IDs.
// Data arrays are empty — populated at runtime by fetchAllIndicators().

export const indicators: Indicator[] = [
  {
    id: "unemployment",
    title: "Unemployment Rate",
    unit: "%",
    color: "#3b82f6",
    description: "General unemployment rate. A rising rate may signal AI-driven displacement in routine jobs",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Labour Force Survey",
    // Stats Canada Table 14-10-0287-03 — Labour Force Survey estimates (LFS), by sex and detailed age group
    // Note: pid=1410028703 resolves to table 14-10-0287-03 (age/sex breakdown). Table 14-10-0287-01
    // is the national summary; both are from the same LFS release. Using -03 for richer age breakdowns.
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410028703",
    data: [],
  },
  {
    id: "youth-unemployment",
    title: "Youth Unemployment (15-24)",
    unit: "%",
    color: "#f59e0b",
    description: "Youth unemployment. An early indicator of how AI adoption affects entry-level job availability",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Labour Force Survey",
    // Stats Canada Table 14-10-0287-03 — LFS estimates by sex and detailed age group (includes 15-24 cohort)
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410028703",
    data: [],
  },
  {
    id: "participation-rate",
    title: "Labour Force Participation",
    unit: "%",
    color: "#10b981",
    description: "Workforce participation rate. Declining participation may reflect AI-driven discouragement or early retirement",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Labour Force Survey",
    // Stats Canada Table 14-10-0287-03 — LFS estimates by sex and detailed age group
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410028703",
    data: [],
  },
  {
    id: "employment-rate",
    title: "Employment Rate",
    unit: "%",
    color: "#8b5cf6",
    description: "Employment-to-population ratio. A direct measure of labour market health amid AI transformation",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Labour Force Survey",
    // Stats Canada Table 14-10-0287-03 — LFS estimates by sex and detailed age group
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410028703",
    data: [],
  },
  {
    id: "cpi",
    title: "Consumer Price Index",
    unit: "index",
    color: "#ef4444",
    description: "CPI all-items (2002=100). Inflation context for AI infrastructure costs and technology spending",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Table 18-10-0004-01",
    // Stats Canada Table 18-10-0004-01 — Consumer Price Index, monthly, not seasonally adjusted
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401",
    data: [],
  },
  {
    id: "gdp",
    title: "GDP (All Industries)",
    unit: "$M",
    color: "#0ea5e9",
    description: "Monthly GDP at basic prices (chained 2017 dollars). Measures total economic output and the broader environment for AI investment and commercialization",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Table 36-10-0434-01",
    // Stats Canada Table 36-10-0434-01 — Gross domestic product (GDP) at basic prices, by industry, monthly
    // Note: pid=3610043401 resolves to 36-10-0434-01 (monthly GDP by industry at basic prices, chained 2017$).
    // This differs from 36-10-0104-01 (annual GDP by expenditure). Monthly by-industry table is correct here.
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3610043401",
    data: [],
  },
]
