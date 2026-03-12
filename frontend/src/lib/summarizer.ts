/**
 * AI Summarizer for AI Canada Pulse
 *
 * Uses OpenAI for AI enrichment with a cheap split:
 * - gpt-5-nano for per-item summaries
 * - gpt-5-mini for dashboard briefs
 *
 * Includes in-memory caching to minimize duplicate calls within a single runtime.
 * Falls back gracefully when the API is unavailable.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ""
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_ARTICLE_MODEL = process.env.OPENAI_ARTICLE_MODEL ?? "gpt-5-nano"
const OPENAI_BRIEF_MODEL = process.env.OPENAI_BRIEF_MODEL ?? "gpt-5-mini"

const TIMEOUT_MS = 25_000

interface CacheEntry<T> {
    data: T
    expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL_MS = 15 * 60 * 1000

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

async function callAI(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    maxCompletionTokens = 1200
): Promise<string | null> {
    if (!OPENAI_API_KEY) {
        console.warn("[summarizer] No OPENAI_API_KEY configured")
        return null
    }

    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const requestBody: Record<string, unknown> = {
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            max_completion_tokens: maxCompletionTokens,
        }

        if (model.startsWith("gpt-5")) {
            requestBody.reasoning_effort = "minimal"
        }

        const res = await fetch(OPENAI_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        })

        clearTimeout(timer)

        if (!res.ok) {
            const errText = await res.text().catch(() => "unknown")
            console.warn(`[summarizer] OpenAI API error ${res.status}: ${errText.slice(0, 200)}`)
            return null
        }

        const data = await res.json()
        const content = data?.choices?.[0]?.message?.content
        if (typeof content === "string" && content.trim()) {
            return content.trim()
        }

        if (Array.isArray(content)) {
            const text = content
                .map((part) => {
                    if (typeof part === "string") return part
                    if (typeof part?.text === "string") return part.text
                    return ""
                })
                .join("")
                .trim()
            if (text) return text
        }

        const refusal = data?.choices?.[0]?.message?.refusal
        if (typeof refusal === "string" && refusal.trim()) {
            console.warn(`[summarizer] OpenAI refusal from ${model}: ${refusal.slice(0, 200)}`)
            return null
        }

        console.warn(`[summarizer] OpenAI returned no text content for ${model}`)
        return null
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            console.warn("[summarizer] OpenAI request timed out")
        } else {
            console.warn("[summarizer] OpenAI error:", err)
        }
        return null
    }
}

async function callArticleSummaryModel(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const primary = await callAI(OPENAI_ARTICLE_MODEL, systemPrompt, userPrompt, 1200)
    if (primary || OPENAI_ARTICLE_MODEL === OPENAI_BRIEF_MODEL) {
        return primary
    }

    console.warn(`[summarizer] Falling back to ${OPENAI_BRIEF_MODEL} for article summaries`)
    return callAI(OPENAI_BRIEF_MODEL, systemPrompt, userPrompt, 1200)
}

interface ArticleForSummary {
    headline: string
    snippet: string
    category: string
    source: string
}

export async function summarizeArticles(
    articles: ArticleForSummary[]
): Promise<Map<string, string> | null> {
    if (!OPENAI_API_KEY || articles.length === 0) return null

    const cacheKey = `articles:${articles.map((a) => a.headline).join("|").slice(0, 200)}`
    const cached = getCached<Map<string, string>>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached article summaries")
        return cached
    }

    const results = new Map<string, string>()
    const batches = chunk(articles, 5)

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
            const snippetUseful = a.snippet && !a.headline.startsWith(a.snippet.split("  ")[0])
            const context = snippetUseful ? a.snippet.slice(0, 220) : "No additional context provided"
            return `${i + 1}. Headline: "${a.headline}"\n   Context: ${context}`
        })
        .join("\n\n")

    const systemPrompt = `You are a wire reporter. For each item, write a clean factual summary in 2-3 sentences (45-90 words).

Rules:
- Use only facts from the provided headline/context
- Do NOT add interpretation, predictions, or implications
- Do NOT mention feed taxonomy, categories, section labels, or metadata
- Do NOT include phrases like "as reported by", "listed under", "categorized as", or "on Google News"
- If context is thin, still produce exactly 2 sentences using only available facts

Output ONLY a JSON array of strings, one summary per item, in the same order.`

    const userPrompt = `Write factual 2-3 sentence summaries for these ${articles.length} Canada AI items:\n\n${articleList}\n\nJSON array of ${articles.length} summaries:`

    const raw = await callArticleSummaryModel(systemPrompt, userPrompt)
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

interface RepoForSummary {
    name: string
    fullName: string
    description: string
    readmeExcerpt: string | null
    language: string
    stars: number
}

export async function summarizeGitHubRepos(
    repos: RepoForSummary[]
): Promise<Map<string, string> | null> {
    if (!OPENAI_API_KEY || repos.length === 0) return null

    const cacheKey = `github:${repos.map((r) => r.fullName).join("|")}`
    const cached = getCached<Map<string, string>>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached GitHub summaries")
        return cached
    }

    const repoList = repos
        .map((r, i) => {
            const context = r.readmeExcerpt || r.description || "No description"
            return `${i + 1}. "${r.fullName}" (${r.language}, ${r.stars} stars)\n   Context: ${context.slice(0, 200)}`
        })
        .join("\n\n")

    const systemPrompt = `You are a technology analyst. For each GitHub repository below, write a clear 1-2 sentence summary (30-50 words) explaining:
1. What the project does in plain language
2. Why it matters for Canadian AI research or industry

Be specific about the technology and its applications. Output ONLY a JSON array of strings, one per repo.`

    const userPrompt = `Summarize these ${repos.length} Canadian AI repositories:\n\n${repoList}\n\nJSON array of ${repos.length} summaries:`

    const raw = await callArticleSummaryModel(systemPrompt, userPrompt)
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

export async function summarizeArxivPapers(
    papers: { title: string; summary: string }[]
): Promise<Map<string, string> | null> {
    if (!OPENAI_API_KEY || papers.length === 0) return null

    const cacheKey = `papers:${papers.map((p) => p.title).join("|").slice(0, 200)}`
    const cached = getCached<Map<string, string>>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached paper summaries")
        return cached
    }

    const paperList = papers
        .map((p, i) => `${i + 1}. "${p.title}"\n   Abstract: ${p.summary.slice(0, 250)}`)
        .join("\n\n")

    const systemPrompt = `You are a science communicator. For each research paper, write a 1-2 sentence plain-language summary (30-50 words) that a non-technical reader can understand. Focus on what problem it solves, the key finding or contribution, and why it matters. Avoid jargon. Output ONLY a JSON array of strings, one summary per paper.`

    const userPrompt = `Summarize each paper in plain language:\n\n${paperList}\n\nJSON array of ${papers.length} summaries:`

    const raw = await callArticleSummaryModel(systemPrompt, userPrompt)
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

export async function generateExecutiveBrief(
    articles: ArticleForSummary[]
): Promise<string[] | null> {
    if (!OPENAI_API_KEY || articles.length === 0) return null

    const cacheKey = `brief:${articles.map((a) => a.headline).join("|").slice(0, 200)}`
    const cached = getCached<string[]>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached executive brief")
        return cached
    }

    const top = articles.slice(0, 20)
    const articleList = top
        .map((a, i) => `${i + 1}. "${a.headline}" [${a.category}] - ${a.source}`)
        .join("\n")

    const systemPrompt = `You are an expert intelligence analyst producing an executive briefing about AI developments in Canada. Write 3-5 thematic bullets that synthesize the key trends rather than listing articles. Each bullet should identify a pattern, shift, or strategic implication. Output ONLY a JSON array of strings.`

    const userPrompt = `Based on these ${top.length} recent AI signals from Canada, write 3-5 executive summary bullets:\n\n${articleList}\n\nJSON array:`

    const raw = await callAI(OPENAI_BRIEF_MODEL, systemPrompt, userPrompt, 1000)
    if (!raw) return null

    const bullets = parseJsonArray(raw)
    if (!bullets || bullets.length === 0) return null

    const result = bullets.slice(0, 5)
    setCache(cacheKey, result)
    return result
}

export async function summarizeGlobalArticles(
    articles: ArticleForSummary[]
): Promise<Map<string, string> | null> {
    if (!OPENAI_API_KEY || articles.length === 0) return null

    const cacheKey = `global-articles:${articles.map((a) => a.headline).join("|").slice(0, 200)}`
    const cached = getCached<Map<string, string>>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached global article summaries")
        return cached
    }

    const results = new Map<string, string>()
    const batches = chunk(articles, 5)

    for (const batch of batches) {
        const batchResults = await summarizeGlobalBatch(batch)
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

async function summarizeGlobalBatch(
    articles: ArticleForSummary[]
): Promise<Map<string, string> | null> {
    const articleList = articles
        .map((a, i) => {
            const snippetUseful = a.snippet && !a.headline.startsWith(a.snippet.split("  ")[0])
            const context = snippetUseful ? a.snippet.slice(0, 220) : "No additional context provided"
            return `${i + 1}. Headline: "${a.headline}"\n   Context: ${context}`
        })
        .join("\n\n")

    const systemPrompt = `You are a wire reporter. For each item, write a clean factual summary in 2-3 sentences (45-90 words).

Rules:
- Use only facts from the provided headline/context
- Do NOT add interpretation, predictions, or implications
- Do NOT mention feed taxonomy, categories, section labels, or metadata
- Do NOT include phrases like "as reported by", "listed under", "categorized as", or "on Google News"
- If context is thin, still produce exactly 2 sentences using only available facts

Output ONLY a JSON array of strings, one summary per item, in the same order.`

    const userPrompt = `Write factual 2-3 sentence summaries for these ${articles.length} global AI items:\n\n${articleList}\n\nJSON array of ${articles.length} summaries:`

    const raw = await callArticleSummaryModel(systemPrompt, userPrompt)
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

export async function generateGlobalBrief(
    articles: ArticleForSummary[]
): Promise<string[] | null> {
    if (!OPENAI_API_KEY || articles.length === 0) return null

    const cacheKey = `global-brief:${articles.map((a) => a.headline).join("|").slice(0, 200)}`
    const cached = getCached<string[]>(cacheKey)
    if (cached) {
        console.log("[summarizer] Using cached global brief")
        return cached
    }

    const top = articles.slice(0, 20)
    const articleList = top
        .map((a, i) => `${i + 1}. "${a.headline}" [${a.category}] - ${a.source}`)
        .join("\n")

    const systemPrompt = `You are an expert intelligence analyst producing an executive briefing about global AI developments. Write 3-5 thematic bullets that synthesize the main worldwide trends rather than listing articles. Each bullet should identify a pattern, shift, or strategic implication. Output ONLY a JSON array of strings.`

    const userPrompt = `Based on these ${top.length} recent global AI signals, write 3-5 executive summary bullets:\n\n${articleList}\n\nJSON array:`

    const raw = await callAI(OPENAI_BRIEF_MODEL, systemPrompt, userPrompt, 1000)
    if (!raw) return null

    const bullets = parseJsonArray(raw)
    if (!bullets || bullets.length === 0) return null

    const result = bullets.slice(0, 5)
    setCache(cacheKey, result)
    return result
}

function parseJsonArray(raw: string): string[] | null {
    let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
    const start = cleaned.indexOf("[")
    const end = cleaned.lastIndexOf("]")
    if (start === -1 || end === -1 || end <= start) return null

    cleaned = cleaned.slice(start, end + 1)

    try {
        const parsed = JSON.parse(cleaned)
        if (!Array.isArray(parsed)) {
            console.warn("[summarizer] parseJsonArray: parsed value is not an array")
            return null
        }

        return parsed.map((item) => {
            if (typeof item === "string") return item
            if (typeof item === "object" && item !== null) {
                return item.summary || item.text || item.brief || item.content || JSON.stringify(item)
            }
            return String(item)
        })
    } catch (e) {
        console.warn("[summarizer] parseJsonArray: JSON.parse failed:", (e as Error).message)
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



