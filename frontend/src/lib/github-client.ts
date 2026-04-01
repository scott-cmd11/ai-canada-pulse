/**
 * GitHub Search API Client
 * Tracks Canadian AI repositories and developer activity.
 * Fetches README excerpts for richer descriptions.
 */

const TIMEOUT_MS = 15_000

function githubHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "AICanadaPulse/1.0",
    }
    if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`
    }
    return headers
}

export interface GitHubRepo {
    name: string
    fullName: string
    description: string
    stars: number
    language: string
    url: string
    updatedAt: string
    topics: string[]
    readmeExcerpt: string | null
}

export interface GitHubData {
    totalRepos: number
    totalStars: number
    topRepos: GitHubRepo[]
    developerCount: number
    fetchedAt: string
}

export async function fetchGitHubData(): Promise<GitHubData> {
    const [repoData, devData] = await Promise.all([
        fetchRepos(),
        fetchDeveloperCount(),
    ])

    return {
        ...repoData,
        developerCount: devData,
        fetchedAt: new Date().toISOString(),
    }
}

async function fetchRepos(): Promise<{
    totalRepos: number
    totalStars: number
    topRepos: GitHubRepo[]
}> {
    try {
        // Run multiple queries in parallel for broader coverage
        const queries = [
            "machine learning canada",
            "deep learning canada",
            "artificial intelligence canada",
            "neural network canada",
            "NLP canada",
        ]

        const allItems: NonNullable<{
            name?: string
            full_name?: string
            description?: string
            stargazers_count?: number
            language?: string
            html_url?: string
            updated_at?: string
            topics?: string[]
        }>[] = []
        let totalCount = 0

        const results = await Promise.all(
            queries.map(async (q) => {
                try {
                    const controller = new AbortController()
                    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
                    const encoded = encodeURIComponent(q)
                    const res = await fetch(
                        `https://api.github.com/search/repositories?q=${encoded}&sort=stars&order=desc&per_page=10`,
                        {
                            headers: githubHeaders(),
                            signal: controller.signal,
                        }
                    )
                    clearTimeout(timer)
                    if (!res.ok) return { total_count: 0, items: [] }
                    return await res.json()
                } catch {
                    return { total_count: 0, items: [] }
                }
            })
        )

        const seen = new Set<string>()
        for (const json of results) {
            totalCount += json.total_count || 0
            for (const item of json.items || []) {
                const key = item.full_name || item.name
                if (!seen.has(key)) {
                    seen.add(key)
                    allItems.push(item)
                }
            }
        }

        // Sort by stars and pick top 6
        allItems.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        const top6 = allItems.slice(0, 6)

        // Fetch README excerpts in parallel for richer descriptions
        const readmeExcerpts = await Promise.all(
            top6.map((r) => fetchReadmeExcerpt(r.full_name || ""))
        )

        const topRepos: GitHubRepo[] = top6.map((r, idx) => ({
            name: r.name || "",
            fullName: r.full_name || "",
            description: r.description || "",
            stars: r.stargazers_count || 0,
            language: r.language || "Unknown",
            url: r.html_url || "",
            updatedAt: r.updated_at || "",
            topics: (r.topics || []).slice(0, 5),
            readmeExcerpt: readmeExcerpts[idx],
        }))

        const totalStars = allItems.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)

        return { totalRepos: totalCount, totalStars, topRepos }
    } catch (err) {
        console.warn("[github-client] Repo fetch failed:", err)
        return { totalRepos: 0, totalStars: 0, topRepos: [] }
    }
}

/** Fetch the first meaningful paragraph of a repo's README */
async function fetchReadmeExcerpt(fullName: string): Promise<string | null> {
    if (!fullName) return null
    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)

        const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
            headers: githubHeaders(),
            signal: controller.signal,
        })
        clearTimeout(timer)

        if (!res.ok) return null

        const json = (await res.json()) as { content?: string; encoding?: string }
        if (!json.content || json.encoding !== "base64") return null

        // Decode base64 README
        const decoded = Buffer.from(json.content, "base64").toString("utf-8")

        // Strip markdown formatting and find first meaningful paragraph
        const lines = decoded.split("\n")
        const paragraphs: string[] = []
        let current = ""

        for (const line of lines) {
            const trimmed = line.trim()

            // Skip headings, badges, empty lines, HTML tags, links-only lines
            if (
                trimmed.startsWith("#") ||
                trimmed.startsWith("!") ||
                trimmed.startsWith("[![") ||
                trimmed.startsWith("<") ||
                trimmed.startsWith("---") ||
                trimmed.startsWith("```") ||
                trimmed.startsWith("|") ||
                trimmed === ""
            ) {
                if (current.length > 30) {
                    paragraphs.push(current.trim())
                }
                current = ""
                continue
            }

            // Strip inline markdown
            const clean = trimmed
                .replace(/\*\*(.+?)\*\*/g, "$1")
                .replace(/\*(.+?)\*/g, "$1")
                .replace(/`(.+?)`/g, "$1")
                .replace(/\[(.+?)\]\(.+?\)/g, "$1")
                .trim()

            if (clean.length > 5) {
                current += (current ? " " : "") + clean
            }
        }
        if (current.length > 30) paragraphs.push(current.trim())

        // Return the first substantive paragraph, truncated to 200 chars
        const best = paragraphs.find((p) => p.length > 40) || paragraphs[0]
        if (!best) return null

        if (best.length <= 200) return best
        const truncated = best.slice(0, 200)
        const lastSpace = truncated.lastIndexOf(" ")
        return (lastSpace > 150 ? truncated.slice(0, lastSpace) : truncated) + "…"
    } catch {
        return null
    }
}

async function fetchDeveloperCount(): Promise<number> {
    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const query = encodeURIComponent("location:canada artificial intelligence")
        const res = await fetch(
            `https://api.github.com/search/users?q=${query}&per_page=1`,
            {
                headers: githubHeaders(),
                signal: controller.signal,
            }
        )
        clearTimeout(timer)

        if (!res.ok) return 0

        const json = (await res.json()) as { total_count?: number }
        return json.total_count || 0
    } catch {
        return 0
    }
}
