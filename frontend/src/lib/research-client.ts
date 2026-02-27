// OpenAlex API client for Canadian AI research papers
// OpenAlex is free, open, and requires no API key
// Docs: https://docs.openalex.org

const OPENALEX_BASE = "https://api.openalex.org"
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

export interface ResearchPaper {
  id: string
  title: string
  publicationDate: string
  citationCount: number
  openAccessUrl: string | null
  doiUrl: string | null
  journal: string | null
  authors: string[]
  institutions: string[]
  concepts: string[]
}

interface CacheEntry {
  papers: ResearchPaper[]
  fetchedAt: number
}

let cache: CacheEntry | null = null

// Canadian AI-focused institutions (OpenAlex institution IDs)
// These are top Canadian research institutions known for AI work
const CANADIAN_INSTITUTION_FILTER = "institutions.country_code:CA"

// AI-related concept IDs in OpenAlex
const AI_CONCEPT_FILTER = "concepts.id:C154945302|C11413529|C119857082|C41008148"
// C154945302 = "Machine learning"
// C11413529  = "Deep learning"
// C119857082 = "Artificial intelligence"
// C41008148  = "Computer science"

interface OpenAlexWork {
  id: string
  title: string
  publication_date: string
  cited_by_count: number
  primary_location?: {
    source?: { display_name?: string }
  }
  open_access?: {
    oa_url?: string | null
  }
  doi?: string | null
  authorships?: Array<{
    author?: { display_name?: string }
    institutions?: Array<{ display_name?: string; country_code?: string }>
  }>
  concepts?: Array<{ display_name?: string; level?: number }>
}

export async function fetchCanadianAIResearch(): Promise<ResearchPaper[]> {
  // Check cache
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.papers
  }

  try {
    const params = new URLSearchParams({
      filter: `${CANADIAN_INSTITUTION_FILTER},${AI_CONCEPT_FILTER},from_publication_date:2024-01-01`,
      sort: "cited_by_count:desc",
      per_page: "15",
      select: "id,title,publication_date,cited_by_count,primary_location,open_access,doi,authorships,concepts",
    })

    const res = await fetch(`${OPENALEX_BASE}/works?${params}`, {
      headers: {
        "User-Agent": "AICanadaPulse/1.0 (mailto:contact@aicanadapulse.ca)",
      },
    })

    if (!res.ok) return []

    const json = await res.json()
    const works: OpenAlexWork[] = json.results ?? []

    const papers: ResearchPaper[] = works.map((w) => ({
      id: w.id,
      title: w.title || "Untitled",
      publicationDate: w.publication_date || "",
      citationCount: w.cited_by_count || 0,
      openAccessUrl: w.open_access?.oa_url || null,
      doiUrl: w.doi ? `https://doi.org/${w.doi.replace("https://doi.org/", "")}` : null,
      journal: w.primary_location?.source?.display_name || null,
      authors: (w.authorships || [])
        .slice(0, 5)
        .map((a) => a.author?.display_name || "Unknown")
        .filter(Boolean),
      institutions: Array.from(
        new Set(
          (w.authorships || [])
            .flatMap((a) =>
              (a.institutions || [])
                .filter((inst) => inst.country_code === "CA")
                .map((inst) => inst.display_name || "")
            )
            .filter(Boolean)
        )
      ).slice(0, 3),
      concepts: (w.concepts || [])
        .filter((c) => (c.level ?? 0) >= 1 && (c.level ?? 0) <= 2)
        .slice(0, 4)
        .map((c) => c.display_name || "")
        .filter(Boolean),
    }))

    cache = { papers, fetchedAt: Date.now() }
    return papers
  } catch {
    return []
  }
}
