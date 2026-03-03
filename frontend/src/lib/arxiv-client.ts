/**
 * arXiv API Client
 * Tracks Canadian AI pre-print publications via Atom XML feed.
 * Uses affiliation-based search to ensure only papers from Canadian
 * institutions appear in results.
 */

const TIMEOUT_MS = 15_000

export interface ArxivPaper {
    title: string
    authors: string[]
    affiliations: string[]
    categories: string[]
    published: string
    summary: string
    arxivUrl: string
}

export interface ArxivData {
    totalResults: number
    papers: ArxivPaper[]
    fetchedAt: string
}

// Major Canadian AI research institutions, labs, and cities
const CANADIAN_AFFILIATIONS = [
    "University of Toronto", "Université de Montréal", "University of Montreal",
    "McGill University", "University of British Columbia", "UBC",
    "University of Alberta", "University of Waterloo", "University of Ottawa",
    "Mila", "Vector Institute", "Amii", "CIFAR",
    "Simon Fraser University", "McMaster University", "Queen's University",
    "University of Calgary", "Dalhousie University", "Western University",
    "Université Laval", "Polytechnique Montréal", "Concordia University",
    "York University", "Carleton University", "Université de Sherbrooke",
    "Cohere", "Element AI", "Borealis AI", "Layer 6", "ServiceNow",
    "Thomson Reuters Canada", "Shopify", "RBC", "TD Bank",
    "Canada", "Canadian", "Ontario", "Quebec", "Québec", "Alberta",
    "British Columbia", "Toronto", "Montreal", "Montréal", "Vancouver",
    "Ottawa", "Edmonton", "Calgary", "Waterloo",
]

const AFFILIATION_REGEX = new RegExp(
    CANADIAN_AFFILIATIONS.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "i"
)

export async function fetchArxivData(): Promise<ArxivData> {
    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        // Fetch more results and filter client-side, since arXiv aff: search is unreliable
        const query = encodeURIComponent(
            "(cat:cs.AI OR cat:cs.LG OR cat:cs.CL) AND (aff:Canada OR aff:Toronto OR aff:Montreal OR aff:Mila OR aff:\"University of British Columbia\" OR aff:\"University of Alberta\" OR aff:Waterloo OR aff:McGill OR aff:\"Vector Institute\" OR aff:Ottawa OR aff:Edmonton)"
        )
        const res = await fetch(
            `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending`,
            { signal: controller.signal }
        )
        clearTimeout(timer)

        if (!res.ok) {
            console.warn(`[arxiv-client] API error: ${res.status}`)
            return { totalResults: 0, papers: [], fetchedAt: new Date().toISOString() }
        }

        const xml = await res.text()
        return parseArxivXml(xml)
    } catch (err) {
        console.warn("[arxiv-client] Fetch failed:", err)
        return { totalResults: 0, papers: [], fetchedAt: new Date().toISOString() }
    }
}

function parseArxivXml(xml: string): ArxivData {
    // Extract total results
    const totalMatch = xml.match(/<opensearch:totalResults[^>]*>(\d+)</)
    const totalResults = totalMatch ? parseInt(totalMatch[1], 10) : 0

    // Extract entries
    const entries = xml.split("<entry>").slice(1) // skip preamble
    const allPapers: ArxivPaper[] = entries.map((entry) => {
        const title = extractTag(entry, "title").replace(/\s+/g, " ").trim()
        const summary = extractTag(entry, "summary").replace(/\s+/g, " ").trim().slice(0, 200)
        const published = extractTag(entry, "published").slice(0, 10) // YYYY-MM-DD
        const arxivUrl = extractAttr(entry, "link", "href", 'title="pdf"') ||
            extractAttr(entry, "link", "href", 'type="text/html"') ||
            extractTag(entry, "id")

        // Extract authors
        const authorMatches = entry.match(/<name>([^<]+)<\/name>/g) || []
        const authors = authorMatches.map((m) => m.replace(/<\/?name>/g, "")).slice(0, 3)

        // Extract affiliations from <arxiv:affiliation> tags
        const affMatches = entry.match(/<arxiv:affiliation[^>]*>([^<]+)<\/arxiv:affiliation>/g) || []
        const affiliations = affMatches.map((m) => m.replace(/<\/?arxiv:affiliation[^>]*>/g, "").trim())

        // Extract categories
        const catMatches = entry.match(/term="(cs\.[A-Z]+)"/g) || []
        const categories = catMatches.map((m) => {
            const match = m.match(/term="([^"]+)"/)
            return match ? match[1] : ""
        }).filter(Boolean)

        return { title, authors, affiliations, categories, published, summary, arxivUrl }
    })

    // Strictly filter to only papers with verified Canadian affiliations
    const canadianPapers = allPapers.filter((paper) => {
        // Check explicit affiliation tags
        if (paper.affiliations.length > 0) {
            return paper.affiliations.some(aff => AFFILIATION_REGEX.test(aff))
        }
        // If no affiliation tags (common), skip paper — we can't verify it's Canadian
        return false
    })

    return { totalResults: canadianPapers.length, papers: canadianPapers.slice(0, 8), fetchedAt: new Date().toISOString() }
}

function extractTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
    return match ? match[1] : ""
}

function extractAttr(xml: string, tag: string, attr: string, filter: string): string {
    const regex = new RegExp(`<${tag}[^>]*${filter}[^>]*${attr}="([^"]*)"`, "i")
    const match = xml.match(regex)
    if (match) return match[1]
    // Try reversed order
    const regex2 = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*${filter}`, "i")
    const match2 = xml.match(regex2)
    return match2 ? match2[1] : ""
}

