/**
 * GitHub Search API Client
 * Tracks Canadian AI repositories and developer activity.
 */

const TIMEOUT_MS = 15_000

export interface GitHubRepo {
    name: string
    fullName: string
    description: string
    stars: number
    language: string
    url: string
    updatedAt: string
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
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const query = encodeURIComponent("artificial intelligence canada language:python")
        const res = await fetch(
            `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10`,
            {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "AICanadaPulse/1.0",
                },
                signal: controller.signal,
            }
        )
        clearTimeout(timer)

        if (!res.ok) {
            console.warn(`[github-client] Repo search error: ${res.status}`)
            return { totalRepos: 0, totalStars: 0, topRepos: [] }
        }

        const json = (await res.json()) as {
            total_count?: number
            items?: {
                name?: string
                full_name?: string
                description?: string
                stargazers_count?: number
                language?: string
                html_url?: string
                updated_at?: string
            }[]
        }

        const items = json.items || []
        const topRepos: GitHubRepo[] = items.slice(0, 6).map((r) => ({
            name: r.name || "",
            fullName: r.full_name || "",
            description: (r.description || "").slice(0, 120),
            stars: r.stargazers_count || 0,
            language: r.language || "Unknown",
            url: r.html_url || "",
            updatedAt: r.updated_at || "",
        }))

        const totalStars = items.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)

        return { totalRepos: json.total_count || 0, totalStars, topRepos }
    } catch (err) {
        console.warn("[github-client] Repo fetch failed:", err)
        return { totalRepos: 0, totalStars: 0, topRepos: [] }
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
                headers: {
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "AICanadaPulse/1.0",
                },
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
