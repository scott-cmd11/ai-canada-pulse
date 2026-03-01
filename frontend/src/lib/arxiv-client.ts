/**
 * arXiv API Client
 * Tracks Canadian AI pre-print publications via Atom XML feed.
 */

const TIMEOUT_MS = 15_000

export interface ArxivPaper {
    title: string
    authors: string[]
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

export async function fetchArxivData(): Promise<ArxivData> {
    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        // Search for AI/ML papers with Canadian affiliations
        const query = encodeURIComponent("(cat:cs.AI OR cat:cs.LG) AND all:Canada")
        const res = await fetch(
            `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`,
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
    const papers: ArxivPaper[] = entries.map((entry) => {
        const title = extractTag(entry, "title").replace(/\s+/g, " ").trim()
        const summary = extractTag(entry, "summary").replace(/\s+/g, " ").trim().slice(0, 200)
        const published = extractTag(entry, "published").slice(0, 10) // YYYY-MM-DD
        const arxivUrl = extractAttr(entry, "link", "href", 'title="pdf"') ||
            extractAttr(entry, "link", "href", 'type="text/html"') ||
            extractTag(entry, "id")

        // Extract authors
        const authorMatches = entry.match(/<name>([^<]+)<\/name>/g) || []
        const authors = authorMatches.map((m) => m.replace(/<\/?name>/g, "")).slice(0, 3)

        // Extract categories
        const catMatches = entry.match(/term="(cs\.[A-Z]+)"/g) || []
        const categories = catMatches.map((m) => {
            const match = m.match(/term="([^"]+)"/)
            return match ? match[1] : ""
        }).filter(Boolean)

        return { title, authors, categories, published, summary, arxivUrl }
    })

    return { totalResults, papers: papers.slice(0, 8), fetchedAt: new Date().toISOString() }
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
