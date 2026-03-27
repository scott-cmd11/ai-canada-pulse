// ─── Source Registry ─────────────────────────────────────────────────────────
// Central registry of every data source the platform uses.
// The methodology page auto-generates from this. SourceAttribution components
// read from this. Nothing renders without being traceable here.

export interface DataSource {
  id: string
  name: string
  url: string
  description: string
  type: "news" | "research" | "government" | "jobs" | "market" | "trends" | "registry"
  refreshInterval: string
  clientFile: string
  dataScope: "national" | "provincial" | "both"
  reliability: "primary" | "aggregated" | "community"
  fetchMethod: "rss" | "api" | "scrape" | "manual"
}

export const SOURCES: DataSource[] = [
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
    id: "openparliament",
    name: "OpenParliament.ca",
    url: "https://openparliament.ca",
    description: "Mentions of artificial intelligence in Canadian parliamentary proceedings (Hansard)",
    type: "government",
    refreshInterval: "24h",
    clientFile: "parliament-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "google-trends",
    name: "Google Trends",
    url: "https://trends.google.com",
    description: "Search interest for AI-related terms across Canadian provinces",
    type: "trends",
    refreshInterval: "12h",
    clientFile: "trends-regional-client.ts",
    dataScope: "both",
    reliability: "aggregated",
    fetchMethod: "api",
  },
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com",
    description: "Trending open-source AI repositories and Canadian developer activity",
    type: "research",
    refreshInterval: "12h",
    clientFile: "github-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "jobs",
    name: "Indeed Canada",
    url: "https://ca.indeed.com",
    description: "AI and machine learning job postings across Canada",
    type: "jobs",
    refreshInterval: "12h",
    clientFile: "jobs-client.ts",
    dataScope: "both",
    reliability: "aggregated",
    fetchMethod: "rss",
  },
  {
    id: "stocks",
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com",
    description: "Stock performance for Canadian AI-related public companies",
    type: "market",
    refreshInterval: "6h",
    clientFile: "stocks-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "gdelt",
    name: "GDELT Project",
    url: "https://www.gdeltproject.org",
    description: "Global event database tracking AI-related events mentioning Canada",
    type: "news",
    refreshInterval: "6h",
    clientFile: "gdelt-client.ts",
    dataScope: "national",
    reliability: "aggregated",
    fetchMethod: "api",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    url: "https://huggingface.co",
    description: "AI model repository activity and Canadian-affiliated model releases",
    type: "research",
    refreshInterval: "24h",
    clientFile: "huggingface-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "epoch-ai",
    name: "Epoch AI",
    url: "https://epochai.org",
    description: "AI model benchmarks and compute trend data",
    type: "research",
    refreshInterval: "weekly",
    clientFile: "epoch-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "alliance-compute",
    name: "Digital Research Alliance of Canada",
    url: "https://alliancecan.ca",
    description: "National research compute cluster status and availability",
    type: "research",
    refreshInterval: "6h",
    clientFile: "alliance-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "statcan",
    name: "Statistics Canada",
    url: "https://www.statcan.gc.ca",
    description: "Labour force and economic data related to AI-sector employment",
    type: "registry",
    refreshInterval: "weekly",
    clientFile: "statcan-sdmx-client.ts",
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
  {
    id: "gov-ai-registry",
    name: "Government of Canada AI Registry",
    url: "https://open.canada.ca/data/en/dataset/fcbc0200-79ba-4fa4-94a6-00e32facea6b",
    description: "Federal inventory of AI and automated decision systems in government use",
    type: "government",
    refreshInterval: "weekly",
    clientFile: "gov-ai-registry-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
  {
    id: "oecd",
    name: "OECD AI Observatory",
    url: "https://oecd.ai",
    description: "AI publications and policy tracker comparing Canada with peer nations",
    type: "research",
    refreshInterval: "weekly",
    clientFile: "oecd-client.ts",
    dataScope: "national",
    reliability: "primary",
    fetchMethod: "api",
  },
]

export function getSourceById(id: string): DataSource | undefined {
  return SOURCES.find((s) => s.id === id)
}

export function getSourcesByType(type: DataSource["type"]): DataSource[] {
  return SOURCES.filter((s) => s.type === type)
}
