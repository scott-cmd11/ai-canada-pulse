/**
 * AI Summarizer for AI Canada Pulse (v2 — factual prompt)
 *
 * Uses OpenAI for AI enrichment with a cheap split:
 * - gpt-4o-mini for per-item summaries
 * - gpt-4o-mini for dashboard briefs
 *
 * Includes in-memory caching to minimize duplicate calls within a single runtime.
 * Falls back gracefully when the API is unavailable.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ""
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_ARTICLE_MODEL = process.env.OPENAI_ARTICLE_MODEL ?? "gpt-4o-mini"
const OPENAI_BRIEF_MODEL = process.env.OPENAI_BRIEF_MODEL ?? "gpt-4o-mini"

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
        console.error("[summarizer] ABORT: OPENAI_API_KEY env var is not set — summaries will be missing")
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
            console.error(`[summarizer] OpenAI ${res.status} ${res.statusText} on ${model}: ${errText.slice(0, 300)}`)
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
            console.error(`[summarizer] OpenAI request timed out after ${TIMEOUT_MS}ms on ${model}`)
        } else {
            console.error(`[summarizer] OpenAI fetch failed on ${model}:`, err)
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


const METADATA_PHRASES = [
    "as reported by",
    "listed under",
    "categorized as",
    "on google news",
    "under industry",
    "under policy",
]

const GENERIC_OPENERS = [
    "the article",
    "the report",
    "the story",
    "the item",
    "this article",
    "this report",
    "this story",
]

const BLAND_PHRASES = [
    "the article discusses",
    "the report discusses",
    "the story discusses",
    "the article highlights",
    "the report highlights",
    "the story highlights",
    "focuses on",
    "addresses",
    "raises questions",
    "underscores the importance",
]

// Sentences that start with pure editorializing — "This signals...", "This highlights..." etc.
// Only match sentence-level patterns, not mid-sentence factual uses like "A survey indicates..."
const INTERPRETIVE_PATTERNS = /^(this (signals?|suggests?|highlights?|underscores?|marks?|represents?|moves?|development|gap|discovery|announcement)|the (findings?|results?|analysis|report) (suggest|indicate|highlight|show that)|paving the way|poised to)/i

const HEADLINE_STOPWORDS = new Set([
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "from", "by",
    "as", "at", "is", "are", "was", "were", "be", "been", "being", "it", "its", "their",
    "his", "her", "that", "this", "these", "those", "after", "over", "under", "into",
    "new", "canada", "canadian", "global", "ai",
])

function sentenceCount(text: string): number {
    return (text.match(/[.!?](\s|$)/g) || []).length
}

function normalizeSummary(text: string | null | undefined): string {
    if (!text) return ""
    return text
        .replace(/\s+/g, " ")
        .replace(/^[-*\s]+/, "")
        .trim()
}

/** Strip sentences containing interpretive/editorial language, keep only factual ones */
function stripInterpretiveSentences(text: string): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const factual = sentences.filter(s => !INTERPRETIVE_PATTERNS.test(s))
    return factual.join(' ').trim() || sentences[0]?.trim() || text
}

function hasMetadataLeak(text: string): boolean {
    const lower = text.toLowerCase()
    return METADATA_PHRASES.some((phrase) => lower.includes(phrase))
}

function hasGenericTone(text: string): boolean {
    const lower = text.toLowerCase()
    return GENERIC_OPENERS.some((opener) => lower.startsWith(opener))
}

function hasBlandCliches(text: string): boolean {
    const lower = text.toLowerCase()
    return BLAND_PHRASES.some((phrase) => lower.includes(phrase))
}

function normalizeBriefBullet(text: string | null | undefined): string {
    if (!text) return ""
    return text
        .replace(/\s+/g, " ")
        .replace(/^[-*\d.)\s]+/, "")
        .trim()
}

function isStrongExecutiveBriefBullet(text: string): boolean {
    const normalized = normalizeBriefBullet(text)
    if (!normalized) return false

    const sentences = sentenceCount(normalized)
    const words = normalized.split(/\s+/).filter(Boolean).length

    if (sentences !== 1) return false
    if (words < 10 || words > 28) return false
    if (hasMetadataLeak(normalized)) return false
    if (hasGenericTone(normalized)) return false
    if (hasBlandCliches(normalized)) return false

    return true
}

async function ensureExecutiveBriefBulletQuality(
    candidate: string | null | undefined,
    articleList: string
): Promise<string | null> {
    const normalizedCandidate = normalizeBriefBullet(candidate)
    if (isStrongExecutiveBriefBullet(normalizedCandidate)) {
        return normalizedCandidate
    }

    const systemPrompt = `You are an expert intelligence analyst producing a Canada AI executive brief.

Requirements:
- Write exactly 1 sentence
- 10 to 28 words
- State a pattern, shift, or implication across the signal set
- Do not recap articles one by one
- Do not use filler framing like "The article/report/story"
- Do not mention feed metadata or source taxonomy
- Use crisp, plain language optimised for quick scanning

Output only the sentence.`

    const userPrompt = `Current Canada AI signals:\n${articleList}\n\nRewrite this bullet as one short high-signal sentence:\n"${normalizedCandidate || "No valid bullet provided."}"`

    const revised = normalizeBriefBullet(await callAI(OPENAI_BRIEF_MODEL, systemPrompt, userPrompt, 160))
    if (isStrongExecutiveBriefBullet(revised)) {
        return revised
    }

    return normalizedCandidate || revised || null
}

function includesHeadlineKeyword(summary: string, headline: string): boolean {
    const normalizedSummary = summary.toLowerCase()
    const keywords = headline
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 5 && !HEADLINE_STOPWORDS.has(token))

    if (keywords.length === 0) return true
    return keywords.some((keyword) => normalizedSummary.includes(keyword))
}

function isStrongArticleSummary(text: string, headline?: string): boolean {
    const normalized = normalizeSummary(text)
    if (!normalized) return false
    const sentences = sentenceCount(normalized)
    const words = normalized.split(/\s+/).filter(Boolean).length
    if (sentences < 3 || sentences > 4) return false
    if (words < 55 || words > 150) return false
    if (hasMetadataLeak(normalized)) return false
    if (hasGenericTone(normalized)) return false
    if (hasBlandCliches(normalized)) return false
    if (headline && !includesHeadlineKeyword(normalized, headline)) return false
    return true
}

async function ensureArticleSummaryQuality(
    candidate: string | null | undefined,
    article: ArticleForSummary,
    scope: "Canada" | "Global"
): Promise<string | null> {
    const normalizedCandidate = stripInterpretiveSentences(normalizeSummary(candidate))
    if (isStrongArticleSummary(normalizedCandidate, article.headline)) {
        return normalizedCandidate
    }

    const snippetUseful = article.snippet && !article.headline.startsWith(article.snippet.split("  ")[0])
    const context = snippetUseful ? article.snippet.slice(0, 260) : "No additional context provided"

    const today = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    const systemPrompt = `Today's date is ${today}. Write a 2-3 sentence factual news summary. State who was involved, what happened, and any concrete details (amounts, locations, dates, numbers). If context is thin, add a sentence with relevant background about the organization, sector, or technology. When source text uses future tense ("will", "upcoming", "starting in") for dates that are now in the past, use past tense instead. Do not start any sentence with "This signals", "This highlights", "This suggests", "This move", or similar editorial phrases. Use Canadian English spelling (e.g. "centre" not "center", "colour" not "color", "labour" not "labor", "defence" not "defense").

Output only the summary text.`

    const userPrompt = `Headline: "${article.headline}"\nContext: ${context}\n\nWrite the summary now.`

    const revisedRaw = await callAI(OPENAI_BRIEF_MODEL, systemPrompt, userPrompt, 380)
    const revised = stripInterpretiveSentences(normalizeSummary(revisedRaw))

    if (isStrongArticleSummary(revised, article.headline)) {
        return revised
    }

    if (normalizedCandidate) {
        return normalizedCandidate
    }

    return revised || null
}
interface ArticleForSummary {
    id: string
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

    const today = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    const systemPrompt = `Today's date is ${today}. Write a 2-3 sentence factual news summary for each item. State who was involved, what happened, and any concrete details from the context (amounts, locations, dates, numbers). If context is thin, add a second sentence with relevant background about the organization, sector, or technology mentioned. When source text uses future tense ("will", "upcoming", "starting in") for dates that are now in the past, use past tense instead (e.g. "launched in January 2024" not "will launch in January 2024"). Do not start any sentence with "This signals", "This highlights", "This suggests", "This move", or similar editorial phrases.

Output ONLY a JSON array of strings, one per item, same order.`

    const userPrompt = `Write 2-3 sentence factual summaries for these ${articles.length} Canada AI news items:\n\n${articleList}\n\nJSON array of ${articles.length} summaries:`

    const raw = await callArticleSummaryModel(systemPrompt, userPrompt)
    if (!raw) return null

    const summaries = parseJsonArray(raw)
    if (!summaries) return null

    const results = new Map<string, string>()
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i]
        const short = article.headline.slice(0, 80)
        let enriched = await ensureArticleSummaryQuality(summaries[i], article, "Canada")

        if (!enriched) {
            // Primary path exhausted — both the batch slot and the in-quality-check
            // revision returned null/empty. Drop the quality gate and try one more
            // time with a minimal prompt. This catches cases where OpenAI refuses
            // or truncates on the stricter ask but handles the simpler one.
            console.warn(`[summarizer] Primary attempt produced no summary for "${short}"; trying fallback`)
            enriched = await emergencyFallbackSummary(article)
            if (enriched) {
                console.log(`[summarizer] Fallback summary succeeded for "${short}"`)
            } else {
                console.warn(`[summarizer] All attempts exhausted for "${short}" — leaving story without aiSummary`)
            }
        }

        if (enriched) {
            results.set(article.id, enriched)
        }
    }

    return results
}

/**
 * Last-resort summarizer: bare 1-sentence ask with no quality gate. Returns
 * whatever OpenAI gives back. Only null if the API itself is unreachable or
 * returns empty content. Called from summarizeBatch when the primary +
 * quality-check revision both fail for a given headline.
 */
async function emergencyFallbackSummary(article: ArticleForSummary): Promise<string | null> {
    const snippetUseful = article.snippet && !article.headline.startsWith(article.snippet.split("  ")[0])
    const context = snippetUseful ? article.snippet.slice(0, 200) : "No additional context provided"

    const systemPrompt = `Write one factual sentence summarising this news item. State who, what, and any concrete detail from the context. Use Canadian English spelling. Output only the sentence.`
    const userPrompt = `Headline: "${article.headline}"\nContext: ${context}`

    const raw = await callAI(OPENAI_BRIEF_MODEL, systemPrompt, userPrompt, 160)
    return normalizeSummary(raw) || null
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

    const systemPrompt = `You are an expert intelligence analyst producing an executive briefing about AI developments in Canada.

Write 3-5 bullets optimised for fast dashboard scanning.

Rules:
- Each bullet must be exactly 1 sentence
- Each bullet should be 10-28 words
- Each bullet must identify a pattern, shift, or strategic implication across the signal set
- Do not list articles one by one
- Do not add subordinate follow-up sentences
- Do not start with generic filler like "The article", "The report", or "This story"
- Do not mention source metadata, feed labels, or categories
- Use concrete, direct language

Output ONLY a JSON array of strings.`

    const userPrompt = `Based on these ${top.length} recent AI signals from Canada, write 3-5 one-sentence executive summary bullets:\n\n${articleList}\n\nJSON array:`

    const raw = await callAI(OPENAI_BRIEF_MODEL, systemPrompt, userPrompt, 1000)
    if (!raw) return null

    const bullets = parseJsonArray(raw)
    if (!bullets || bullets.length === 0) return null

    const result: string[] = []
    for (const bullet of bullets.slice(0, 5)) {
        const enriched = await ensureExecutiveBriefBulletQuality(bullet, articleList)
        if (enriched) {
            result.push(enriched)
        }
    }

    if (result.length === 0) return null

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
