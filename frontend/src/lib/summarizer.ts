/**
 * AI Article Summarizer for AI Canada Pulse
 * 
 * Uses HuggingFace Inference API (Qwen 2.5-7B via Together router)
 * to generate concise, analyst-grade summaries for news articles.
 * 
 * Falls back gracefully to raw RSS snippets when the API is unavailable.
 */

const HF_API_TOKEN = process.env.HF_API_TOKEN ?? ""
const HF_MODEL = "Qwen/Qwen2.5-7B-Instruct-Turbo"
const HF_BASE_URL = "https://router.huggingface.co/together/v1"
const TIMEOUT_MS = 20_000

interface ArticleForSummary {
    headline: string
    snippet: string
    category: string
    source: string
}

// ─── Per-Article Summaries (batch) ──────────────────────────────────────────

/**
 * Generate concise 1-2 sentence summaries for a batch of articles.
 * Returns a map of headline → AI summary.
 * Returns null if API is unavailable.
 */
export async function summarizeArticles(
    articles: ArticleForSummary[]
): Promise<Map<string, string> | null> {
    if (!HF_API_TOKEN || articles.length === 0) return null

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

    return results.size > 0 ? results : null
}

async function summarizeBatch(
    articles: ArticleForSummary[]
): Promise<Map<string, string> | null> {
    const articleList = articles
        .map((a, i) => `${i + 1}. "${a.headline}" — ${a.source}\n   Context: ${a.snippet.slice(0, 150)}`)
        .join("\n")

    const systemPrompt = `You are a senior intelligence analyst. For each article below, write 2-3 concise sentences (40-60 words total) that capture the key takeaway and its significance for a Canadian AI policy audience. Be specific, factual, and analytical — avoid generic phrases like "This article discusses..."

Output ONLY a JSON array of strings, one per article, in the same order. Example: ["Two sentence summary here. Second sentence adds context.", "Another summary. With its second sentence."]`

    const userPrompt = `Summarize each article in 2-3 sentences:\n\n${articleList}\n\nJSON array of ${articles.length} summaries:`

    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const res = await fetch(`${HF_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: HF_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                max_tokens: 1024,
                temperature: 0.3,
            }),
            signal: controller.signal,
        })

        clearTimeout(timer)

        if (!res.ok) {
            console.warn(`[summarizer] HF API error ${res.status}`)
            return null
        }

        const data = await res.json() as {
            choices?: { message?: { content?: string } }[]
        }

        const raw = data?.choices?.[0]?.message?.content?.trim()
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
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            console.warn("[summarizer] Request timed out")
        } else {
            console.warn("[summarizer] Error:", err)
        }
        return null
    }
}

// ─── Executive Brief (thematic bullets) ────────────────────────────────────

/**
 * Generate 3-5 thematic executive brief bullets from all current stories.
 * Returns null if API is unavailable.
 */
export async function generateExecutiveBrief(
    articles: ArticleForSummary[]
): Promise<string[] | null> {
    if (!HF_API_TOKEN || articles.length === 0) return null

    const top = articles.slice(0, 20)
    const articleList = top
        .map((a, i) => `${i + 1}. "${a.headline}" [${a.category}] — ${a.source}`)
        .join("\n")

    const systemPrompt = `You are an expert intelligence analyst producing an executive briefing about AI developments in Canada. Write 3-5 thematic bullets that synthesize the key trends, not just list articles. Each bullet should identify a pattern, shift, or strategic implication. Be specific and analytical. Output ONLY a JSON array of strings.`

    const userPrompt = `Based on these ${top.length} recent AI signals from Canada, write 3-5 executive summary bullets:\n\n${articleList}\n\nJSON array:`

    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const res = await fetch(`${HF_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: HF_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                max_tokens: 512,
                temperature: 0.4,
            }),
            signal: controller.signal,
        })

        clearTimeout(timer)

        if (!res.ok) {
            console.warn(`[summarizer] Executive brief API error ${res.status}`)
            return null
        }

        const data = await res.json() as {
            choices?: { message?: { content?: string } }[]
        }

        const raw = data?.choices?.[0]?.message?.content?.trim()
        if (!raw) return null

        const bullets = parseJsonArray(raw)
        return bullets && bullets.length > 0 ? bullets.slice(0, 5) : null
    } catch (err) {
        console.warn("[summarizer] Executive brief error:", err)
        return null
    }
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
