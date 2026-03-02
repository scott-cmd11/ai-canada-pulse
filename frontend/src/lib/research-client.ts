// OpenAlex API client for Canadian AI research papers
// OpenAlex is free, open, and requires no API key
// Docs: https://docs.openalex.org

import { unstable_cache } from "next/cache"

const OPENALEX_BASE = "https://api.openalex.org"

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
  summary: string | null
}


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
  abstract_inverted_index?: Record<string, number[]>
}

/** Reconstruct plain text from OpenAlex inverted index */
function reconstructAbstract(invertedIndex: Record<string, number[]> | undefined): string | null {
  if (!invertedIndex) return null
  const words: [number, string][] = []
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([pos, word])
    }
  }
  words.sort((a, b) => a[0] - b[0])
  const text = words.map(([, w]) => w).join(" ")
  if (text.length <= 200) return text
  const truncated = text.slice(0, 200)
  const lastSpace = truncated.lastIndexOf(" ")
  return (lastSpace > 150 ? truncated.slice(0, lastSpace) : truncated) + "…"
}

/** Generate a plain-language summary from title + concepts when no abstract is available */
function generateFallbackSummary(title: string, concepts: string[], journal: string | null, citationCount: number): string {
  const conceptStr = concepts.length > 0 ? concepts.slice(0, 3).join(", ").toLowerCase() : "AI research"
  const impactNote = citationCount > 10000
    ? "A landmark paper"
    : citationCount > 1000
      ? "A highly cited study"
      : citationCount > 100
        ? "A significant contribution"
        : "Research"
  const venue = journal ? ` published in ${journal}` : ""
  return `${impactNote}${venue} in the field of ${conceptStr}. This work, \"${title.length > 80 ? title.slice(0, 80) + '...' : title}\", has been cited ${citationCount.toLocaleString()} times by other researchers.`
}

export interface ResearchResult {
  papers: ResearchPaper[]
  fetchedAt: string
}

async function _fetchCanadianAIResearch(): Promise<ResearchResult> {
  try {
    const params = new URLSearchParams({
      filter: `${CANADIAN_INSTITUTION_FILTER},${AI_CONCEPT_FILTER},from_publication_date:2024-01-01`,
      sort: "cited_by_count:desc",
      per_page: "15",
      select: "id,title,publication_date,cited_by_count,primary_location,open_access,doi,authorships,concepts,abstract_inverted_index",
    })

    const res = await fetch(`${OPENALEX_BASE}/works?${params}`, {
      headers: {
        "User-Agent": "AICanadaPulse/1.0 (mailto:contact@aicanadapulse.ca)",
      },
    })

    if (!res.ok) return { papers: [], fetchedAt: new Date().toISOString() }

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
      summary: reconstructAbstract(w.abstract_inverted_index)
        || generateFallbackSummary(
          w.title || "Untitled",
          (w.concepts || []).filter(c => (c.level ?? 0) >= 1 && (c.level ?? 0) <= 2).slice(0, 3).map(c => c.display_name || "").filter(Boolean),
          w.primary_location?.source?.display_name || null,
          w.cited_by_count || 0
        ),
    }))

    return { papers, fetchedAt: new Date().toISOString() }
  } catch (err) {
    console.warn("[research-client] Failed to fetch Canadian AI research:", err)
    return { papers: [], fetchedAt: new Date().toISOString() }
  }
}

export const fetchCanadianAIResearch = unstable_cache(
  _fetchCanadianAIResearch,
  ["openalex-canadian-ai-research"],
  { revalidate: 21600 } // 6 hours
)
