// Open Canada CKAN API client for Government AI Registry
// Fetches Algorithmic Impact Assessment data from the Treasury Board
// Docs: https://open.canada.ca/data/en/dataset

const CKAN_BASE = "https://open.canada.ca/data/api/3"
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

export interface GovAISystem {
  id: string
  title: string
  department: string
  riskLevel: string
  description: string
  url: string | null
  datePublished: string | null
}

interface CacheEntry {
  systems: GovAISystem[]
  fetchedAt: number
}

let cache: CacheEntry | null = null

export async function fetchGovAIRegistry(): Promise<GovAISystem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.systems
  }

  try {
    // Search for Algorithmic Impact Assessment datasets
    const params = new URLSearchParams({
      q: "algorithmic impact assessment artificial intelligence",
      rows: "50",
      sort: "metadata_modified desc",
    })

    const res = await fetch(`${CKAN_BASE}/action/package_search?${params}`, {
      headers: { "User-Agent": "AICanadaPulse/1.0" },
    })

    if (!res.ok) return cache?.systems ?? []

    const json = await res.json()
    const results = json.result?.results ?? []

    const systems: GovAISystem[] = results
      .filter((pkg: Record<string, unknown>) => {
        const title = ((pkg.title as string) || "").toLowerCase()
        const notes = ((pkg.notes as string) || "").toLowerCase()
        return (
          title.includes("artificial intelligence") ||
          title.includes("algorithmic") ||
          title.includes("machine learning") ||
          notes.includes("artificial intelligence") ||
          notes.includes("algorithmic impact")
        )
      })
      .map((pkg: Record<string, unknown>) => ({
        id: (pkg.id as string) || "",
        title: (pkg.title as string) || "Untitled",
        department: (pkg.organization as Record<string, string>)?.title || "Government of Canada",
        riskLevel: extractRiskLevel(pkg),
        description: truncate((pkg.notes as string) || "", 200),
        url: (pkg.url as string) || null,
        datePublished: (pkg.metadata_modified as string)?.slice(0, 10) || null,
      }))

    cache = { systems, fetchedAt: Date.now() }
    return systems
  } catch {
    return cache?.systems ?? []
  }
}

function extractRiskLevel(pkg: Record<string, unknown>): string {
  const notes = ((pkg.notes as string) || "").toLowerCase()
  const title = ((pkg.title as string) || "").toLowerCase()
  const combined = `${title} ${notes}`

  if (combined.includes("level iv") || combined.includes("level 4") || combined.includes("high risk")) return "High"
  if (combined.includes("level iii") || combined.includes("level 3") || combined.includes("moderate")) return "Moderate"
  if (combined.includes("level ii") || combined.includes("level 2")) return "Low"
  if (combined.includes("level i") || combined.includes("level 1") || combined.includes("minimal")) return "Minimal"
  return "Unclassified"
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len).trimEnd() + "..."
}
