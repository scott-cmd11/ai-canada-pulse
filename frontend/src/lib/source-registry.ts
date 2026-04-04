// ─── Source Registry ─────────────────────────────────────────────────────────
// Central registry of every data source the platform uses.
// The methodology page auto-generates from this. SourceAttribution components
// read from this. Nothing renders without being traceable here.
//
// Only sources that are actively rendered on the site should be listed here.

export interface DataSource {
  id: string
  name: string
  url: string
  description: string
  type: "news" | "research" | "government" | "jobs" | "registry" | "startup" | "benchmark" | "regulatory"
  refreshInterval: string
  clientFile: string
  dataScope: "national" | "provincial" | "both"
  reliability: "primary" | "aggregated" | "community"
  fetchMethod: "rss" | "api" | "scrape" | "manual"
}

export const SOURCES: DataSource[] = [
  // ─── News ─────────────────────────────────────────────────────────────────
  {
    id: "rss-news",
    name: "Canadian News Feeds",
    url: "https://news.google.com",
    description: "AI-related news from Google News, BetaKit, and CBC Technology RSS feeds",
    type: "news",
    refreshInterval: "6h",
    clientFile: "rss-client.ts",
    dataScope: "both",
    reliability: "aggregated",
    fetchMethod: "rss",
  },

  // ─── Research ─────────────────────────────────────────────────────────────
  {
    id: "arxiv",
    name: "arXiv.org",
    url: "https://arxiv.org",
    description: "Pre-print research papers in AI and machine learning with Canadian-affiliated authors",
    type: "research",
    refreshInterval: "12h",
    clientFile: "arxiv-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "openalex",
    name: "OpenAlex",
    url: "https://openalex.org",
    description: "Open scholarly metadata for AI-related publications by Canadian researchers",
    type: "research",
    refreshInterval: "12h",
    clientFile: "research-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },

  // ─── Government ───────────────────────────────────────────────────────────
  {
    id: "openparliament",
    name: "OpenParliament.ca",
    url: "https://openparliament.ca",
    description: "AI mentions in the federal House of Commons (Hansard). Federal Parliament only — does not cover Senate or provincial/territorial legislatures.",
    type: "government",
    refreshInterval: "24h",
    clientFile: "parliament-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },

  // ─── Jobs ─────────────────────────────────────────────────────────────────
  {
    id: "jobs",
    name: "Government of Canada Job Bank",
    url: "https://open.canada.ca/data/en/dataset/ea639e28-c0fc-48bf-b5dd-b8899bd43072",
    description: "Monthly AI job postings from Canada's National Job Bank open data (no API key required)",
    type: "jobs",
    refreshInterval: "24h",
    clientFile: "jobs-client.ts",
    dataScope: "both",
    reliability: "primary",
    fetchMethod: "api",
  },

  // ─── Data Registries ──────────────────────────────────────────────────────
  {
    id: "statcan",
    name: "Statistics Canada",
    url: "https://www.statcan.gc.ca",
    description: "Labour force and economic data related to AI-sector employment",
    type: "registry",
    refreshInterval: "weekly",
    clientFile: "statscan-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },

  // ─── Regulatory ───────────────────────────────────────────────────────────
  {
    id: "legisinfo",
    name: "LEGISinfo",
    url: "https://www.parl.ca/legisinfo/",
    description: "AI-related bills and legislation in the Parliament of Canada",
    type: "regulatory",
    refreshInterval: "12h",
    clientFile: "legisinfo-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "provincial-regulation",
    name: "Provincial AI Regulation",
    url: "https://www.canada.ca/en/government/system/digital-government.html",
    description: "Provincial and federal AI regulatory frameworks, directives, and guidelines",
    type: "regulatory",
    refreshInterval: "quarterly",
    clientFile: "provincial-regulation-data.ts",
    dataScope: "both",
    reliability: "aggregated",
    fetchMethod: "manual",
  },

  // ─── Benchmarks & Rankings ────────────────────────────────────────────────
  {
    id: "global-ai-index",
    name: "Global AI Index",
    url: "https://aiindex.stanford.edu",
    description: "International AI rankings comparing Canada across talent, research, and commercial dimensions",
    type: "benchmark",
    refreshInterval: "annually",
    clientFile: "global-ai-index-data.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "manual",
  },

  // ─── Startups & Ecosystem ─────────────────────────────────────────────────
  {
    id: "startups",
    name: "Canadian AI Startups",
    url: "https://betakit.com",
    description: "Curated directory of notable Canadian AI startups with funding signals from news",
    type: "startup",
    refreshInterval: "6h",
    clientFile: "startup-signals-client.ts",
    dataScope: "both",
    reliability: "aggregated",
    fetchMethod: "rss",
  },
]

export function getSourceById(id: string): DataSource | undefined {
  return SOURCES.find((s) => s.id === id)
}

export function getSourcesByType(type: DataSource["type"]): DataSource[] {
  return SOURCES.filter((s) => s.type === type)
}
