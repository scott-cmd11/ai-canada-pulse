/**
 * AI Summarizer for AI Canada Pulse
 * 
 * Uses Gemini 2.0 Flash for AI enrichment.
 * Includes in-memory caching to minimize API calls across visitors.
 * Falls back gracefully when API is unavailable.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ""
const GEMINI_MODEL = "gemini-2.5-flash"
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

const TIMEOUT_MS = 15_000

// ─── In-Memory Cache ────────────────────────────────────────────────────────
// Caches results for 30 minutes to avoid redundant API calls from multiple visitors

interface CacheEntry<T> {
    data: T
    expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

function getCached<T>(key: string): T | null {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return null
    }
    return entry.data as T
}

function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ─── AI Provider (Gemini) ───────────────────────────────────────────────────

async function callAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
    if (!GEMINI_API_KEY) {
        console.warn("[summarizer] No GEMINI_API_KEY configured")
        return null
    }
    return callGemini(systemPrompt, userPrompt)
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const res = await fetch(
            `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemPrompt }],
                    },
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: userPrompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 2048,
                        responseMimeType: "application/json",
                    },
                }),
                signal: controller.signal,
            }
        )

        clearTimeout(timer)

        if (!res.ok) {
            const errText = await res.text().catch(() => "unknown")
            console.warn(`[summarizer] Gemini API error ${res.status}: ${errText.slice(0, 200)}`)
            return null
        }

        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        return text || null
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            console.warn("[summarizer] Gemini request timed out")
        } else {
            console.warn("[summarizer] Gemini error:", err)
        }
        return null
    }
}


// ─── Per-Article Summaries (batch) ──────────────────────────────────────────

interface ArticleForSummary {
    headline: string
    snippet: string
    category: string
    source: string
}

/**
 * Generate concise 1-2 sentence summaries for a batch of articles.
 * Returns a map of headline → AI summary.
 * Returns null if API is unavailable.
 */
export async function summarizeArticles(
    articles: ArticleForSummary[]
): Promise<Map<string, string> | null> {
    if (!GEMINI_API_KEY || articles.length === 0) return null

    // Check cache
    const cacheKey = `articles:${articles.map((a) => a.headline).join("|").slice(0, 200)}`
    const cached = getCached<Map<string, string>>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached article summaries")
        return cached
    }

    // Process in batches of 10
    const results = new Map<string, string>()
    const batches = chunk(articles, 10)

    for (const batch of batches) {
        const batchResults = await summarizeBatch(batch)
        if (batchResults) {
            Array.from(batchResults.entries()).forEach(([key, value]) => {
                results.set(key, value)
            })
        }
    }

    if (results.size > 0) {
        setCache(cacheKey, results)
    }

    return results.size > 0 ? results : null
}

async function summarizeBatch(
    articles: ArticleForSummary[]
): Promise<Map<string, string> | null> {
    const articleList = articles
        .map((a, i) => {
            // Include snippet only if it adds real info beyond the headline
            const snippetUseful = a.snippet && !a.headline.startsWith(a.snippet.split("  ")[0])
            const context = snippetUseful ? `\n   Context: ${a.snippet.slice(0, 200)}` : ""
            return `${i + 1}. "${a.headline}" [${a.category}] — ${a.source}${context}`
        })
        .join("\n")

    const systemPrompt = `You are a senior intelligence analyst covering Canadian AI developments. For each headline below, write a 2-3 sentence analytical brief (50-80 words) that:
1. Explains the significance of the development in plain language
2. Provides relevant context (e.g. related policies, companies, or trends)
3. Notes the broader implications for Canada's AI ecosystem

Draw on your deep knowledge of Canadian AI policy, industry players, research institutions, and global context. Be specific, insightful, and provide ORIGINAL ANALYSIS — never repeat or rephrase the headline. Some articles may have thin or missing context; use your knowledge to fill in the gaps.

Output ONLY a JSON array of strings, one per article, in the same order.`

    const userPrompt = `Write analytical briefs for these ${articles.length} articles:\n\n${articleList}\n\nJSON array of ${articles.length} briefs:`

    const raw = await callAI(systemPrompt, userPrompt)
    if (!raw) return null

    const summaries = parseJsonArray(raw)
    if (!summaries) return null

    const results = new Map<string, string>()
    articles.forEach((a, i) => {
        if (summaries[i]) {
            results.set(a.headline, summaries[i])
        }
    })
    return results
}

// ─── GitHub Repo Summaries ──────────────────────────────────────────────────

interface RepoForSummary {
    name: string
    fullName: string
    description: string
    readmeExcerpt: string | null
    language: string
    stars: number
}

/**
 * Generate concise AI summaries for GitHub repos.
 */
export async function summarizeGitHubRepos(
    repos: RepoForSummary[]
): Promise<Map<string, string> | null> {
    if (!GEMINI_API_KEY || repos.length === 0) return null

    const cacheKey = `github:${repos.map((r) => r.fullName).join("|")}`
    const cached = getCached<Map<string, string>>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached GitHub summaries")
        return cached
    }

    const repoList = repos
        .map((r, i) => {
            const context = r.readmeExcerpt || r.description || "No description"
            return `${i + 1}. "${r.fullName}" (${r.language}, ★${r.stars})\n   Context: ${context.slice(0, 200)}`
        })
        .join("\n\n")

    const systemPrompt = `You are a technology analyst. For each GitHub repository below, write a clear 1-2 sentence summary (30-50 words) explaining:
1. What the project does in plain language
2. Why it matters for Canadian AI research or industry

Be specific about the technology and its applications. Do NOT just repeat the repo name. If the context is thin, infer from the name and language.

Output ONLY a JSON array of strings, one per repo.`

    const userPrompt = `Summarize these ${repos.length} Canadian AI repositories:\n\n${repoList}\n\nJSON array of ${repos.length} summaries:`

    const raw = await callAI(systemPrompt, userPrompt)
    if (!raw) return null

    const summaries = parseJsonArray(raw)
    if (!summaries) return null

    const results = new Map<string, string>()
    repos.forEach((r, i) => {
        if (summaries[i]) {
            results.set(r.fullName, summaries[i])
        }
    })

    if (results.size > 0) {
        setCache(cacheKey, results)
    }

    return results
}

// ─── arXiv Paper Summaries ──────────────────────────────────────────────────

/**
 * Generate plain-language summaries for research papers.
 */
export async function summarizeArxivPapers(
    papers: { title: string; summary: string }[]
): Promise<Map<string, string> | null> {
    if (!GEMINI_API_KEY || papers.length === 0) return null

    const cacheKey = `papers:${papers.map((p) => p.title).join("|").slice(0, 200)}`
    const cached = getCached<Map<string, string>>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached paper summaries")
        return cached
    }

    const paperList = papers
        .map((p, i) => `${i + 1}. "${p.title}"\n   Abstract: ${p.summary.slice(0, 250)}`)
        .join("\n\n")

    const systemPrompt = `You are a science communicator. For each research paper, write a 1-2 sentence plain-language summary (30-50 words) that a non-technical reader can understand. Focus on: what problem it solves, the key finding or contribution, and why it matters. Avoid jargon. Output ONLY a JSON array of strings, one summary per paper.`

    const userPrompt = `Summarize each paper in plain language:\n\n${paperList}\n\nJSON array of ${papers.length} summaries:`

    const raw = await callAI(systemPrompt, userPrompt)
    if (!raw) return null

    const summaries = parseJsonArray(raw)
    if (!summaries) return null

    const results = new Map<string, string>()
    papers.forEach((p, i) => {
        if (summaries[i]) {
            results.set(p.title, summaries[i])
        }
    })

    if (results.size > 0) {
        setCache(cacheKey, results)
    }

    return results
}

// ─── Executive Brief (thematic bullets) ────────────────────────────────────

/**
 * Generate 3-5 thematic executive brief bullets from all current stories.
 */
export async function generateExecutiveBrief(
    articles: ArticleForSummary[]
): Promise<string[] | null> {
    if (!GEMINI_API_KEY || articles.length === 0) return null

    const cacheKey = `brief:${articles.map((a) => a.headline).join("|").slice(0, 200)}`
    const cached = getCached<string[]>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached executive brief")
        return cached
    }

    const top = articles.slice(0, 20)
    const articleList = top
        .map((a, i) => `${i + 1}. "${a.headline}" [${a.category}] — ${a.source}`)
        .join("\n")

    const systemPrompt = `You are an expert intelligence analyst producing an executive briefing about AI developments in Canada. Write 3-5 thematic bullets that synthesize the key trends, not just list articles. Each bullet should identify a pattern, shift, or strategic implication. Be specific and analytical. Output ONLY a JSON array of strings.`

    const userPrompt = `Based on these ${top.length} recent AI signals from Canada, write 3-5 executive summary bullets:\n\n${articleList}\n\nJSON array:`

    const raw = await callAI(systemPrompt, userPrompt)
    if (!raw) return null

    const bullets = parseJsonArray(raw)
    if (!bullets || bullets.length === 0) return null

    const result = bullets.slice(0, 5)
    setCache(cacheKey, result)
    return result
}

// ─── Global Article Summaries (neutral, non-Canada-focused) ────────────────

/**
 * Generate neutral summaries for global AI articles (no Canada-specific framing).
 */
export async function summarizeGlobalArticles(
    articles: ArticleForSummary[]
): Promise<Map<string, string> | null> {
    if (!GEMINI_API_KEY || articles.length === 0) return null

    const cacheKey = `global-articles:${articles.map((a) => a.headline).join("|").slice(0, 200)}`
    const cached = getCached<Map<string, string>>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached global article summaries")
        return cached
    }

    const articleList = articles
        .map((a, i) => {
            const snippetUseful = a.snippet && !a.headline.startsWith(a.snippet.split("  ")[0])
            const context = snippetUseful ? `\n   Context: ${a.snippet.slice(0, 200)}` : ""
            return `${i + 1}. "${a.headline}" [${a.category}] — ${a.source}${context}`
        })
        .join("\n")

    const systemPrompt = `You are a senior technology analyst covering global AI developments. For each headline below, write a 2-3 sentence analytical brief (50-80 words) that:
1. Explains the significance of the development in plain language
2. Provides relevant context (e.g. related companies, policies, or industry trends)
3. Notes the broader implications for the global AI landscape

Be specific, insightful, and provide ORIGINAL ANALYSIS — never repeat or rephrase the headline. Some articles may have thin or missing context; use your knowledge to fill in the gaps.

Output ONLY a JSON array of strings, one per article, in the same order.`

    const userPrompt = `Write analytical briefs for these ${articles.length} global AI articles:\n\n${articleList}\n\nJSON array of ${articles.length} briefs:`

    const raw = await callAI(systemPrompt, userPrompt)
    if (!raw) return null

    const summaries = parseJsonArray(raw)
    if (!summaries) return null

    const results = new Map<string, string>()
    articles.forEach((a, i) => {
        if (summaries[i]) {
            results.set(a.headline, summaries[i])
        }
    })

    if (results.size > 0) {
        setCache(cacheKey, results)
    }
    return results.size > 0 ? results : null
}

/**
 * Generate 3-5 thematic executive brief bullets about global AI trends.
 */
export async function generateGlobalBrief(
    articles: ArticleForSummary[]
): Promise<string[] | null> {
    if (!GEMINI_API_KEY || articles.length === 0) return null

    const cacheKey = `global-brief:${articles.map((a) => a.headline).join("|").slice(0, 200)}`
    const cached = getCached<string[]>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached global brief")
        return cached
    }

    const top = articles.slice(0, 20)
    const articleList = top
        .map((a, i) => `${i + 1}. "${a.headline}" [${a.category}] — ${a.source}`)
        .join("\n")

    const systemPrompt = `You are an expert intelligence analyst producing an executive briefing about global AI developments. Write 3-5 thematic bullets that synthesize the key worldwide trends, not just list articles. Each bullet should identify a pattern, shift, or strategic implication in the global AI landscape. Be specific and analytical. Output ONLY a JSON array of strings.`

    const userPrompt = `Based on these ${top.length} recent global AI signals, write 3-5 executive summary bullets:\n\n${articleList}\n\nJSON array:`

    const raw = await callAI(systemPrompt, userPrompt)
    if (!raw) return null

    const bullets = parseJsonArray(raw)
    if (!bullets || bullets.length === 0) return null

    const result = bullets.slice(0, 5)
    setCache(cacheKey, result)
    return result
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseJsonArray(raw: string): string[] | null {
    let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
    const start = cleaned.indexOf("[")
    const end = cleaned.lastIndexOf("]")
    if (start === -1 || end === -1 || end <= start) return null

    cleaned = cleaned.slice(start, end + 1)

    try {
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
            return parsed
        }
        return null
    } catch {
        return null
    }
}

function chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size))
    }
    return chunks
}
