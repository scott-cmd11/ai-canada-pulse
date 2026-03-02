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
    description: "General unemployment rate — a rising rate may signal AI-driven displacement in routine jobs",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Labour Force Survey",
    data: [],
  },
  {
    id: "youth-unemployment",
    title: "Youth Unemployment (15-24)",
    unit: "%",
    color: "#f59e0b",
    description: "Youth unemployment — early indicator of how AI adoption affects entry-level job availability",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Labour Force Survey",
    data: [],
  },
  {
    id: "participation-rate",
    title: "Labour Force Participation",
    unit: "%",
    color: "#10b981",
    description: "Workforce participation rate — declining participation may reflect AI-driven discouragement or early retirement",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Labour Force Survey",
    data: [],
  },
  {
    id: "employment-rate",
    title: "Employment Rate",
    unit: "%",
    color: "#8b5cf6",
    description: "Employment-to-population ratio — a direct measure of labour market health amid AI transformation",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Labour Force Survey",
    data: [],
  },
  {
    id: "cpi",
    title: "Consumer Price Index",
    unit: "index",
    color: "#ef4444",
    description: "CPI all-items (2002=100) — inflation context for AI infrastructure costs and technology spending",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Table 18-10-0004",
    data: [],
  },
  {
    id: "gdp",
    title: "GDP (All Industries)",
    unit: "$M",
    color: "#0ea5e9",
    description: "Monthly GDP at basic prices (chained 2017 dollars) — measures total economic output and the broader environment for AI investment and commercialization",
    frequency: "monthly",
    source: "statscan",
    sourceLabel: "Statistics Canada, Table 36-10-0434",
    data: [],
  },
]
