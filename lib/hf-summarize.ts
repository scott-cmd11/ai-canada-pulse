/**
 * Hugging Face Inference API client for AI-powered narrative summaries.
 *
 * Uses the OpenAI-compatible chat/completions endpoint on a free-tier
 * model (Mistral-7B-Instruct). Falls back gracefully on timeout,
 * missing token, or any API error.
 */

const HF_API_TOKEN = process.env.HF_API_TOKEN ?? "";
const HF_MODEL = "Qwen/Qwen2.5-7B-Instruct-Turbo";
const HF_BASE_URL = "https://router.huggingface.co/together/v1";
const TIMEOUT_MS = 15_000;

interface ArticleInput {
    title: string;
    category: string;
    jurisdiction: string;
    publisher: string;
}

/**
 * Generate 3-5 narrative summary bullets from a batch of articles using
 * the Hugging Face Inference API (OpenAI-compatible chat/completions).
 *
 * Returns `null` if the API is unavailable, token is missing, or the
 * request times out — callers should fall back to template summaries.
 */
export async function generateAiSummary(
    articles: ArticleInput[],
    timeWindow: string,
): Promise<string[] | null> {
    if (!HF_API_TOKEN) {
        console.warn("[hf-summarize] No HF_API_TOKEN set — skipping AI summary.");
        return null;
    }

    if (articles.length === 0) {
        return null;
    }

    // Build a condensed article list for the prompt (limit to top 20)
    const top = articles.slice(0, 20);
    const articleList = top
        .map(
            (a, i) =>
                `${i + 1}. "${a.title}" [${a.category}] — ${a.publisher}, ${a.jurisdiction}`,
        )
        .join("\n");

    const systemPrompt = `You are an expert intelligence analyst producing executive briefings about AI developments in Canada. Write in a professional, concise, and analytical tone. Output only a JSON array of 3 to 5 summary bullet strings — no markdown, no extra keys, just the JSON array.`;

    const userPrompt = `Based on the following ${top.length} AI signals tracked over the last ${timeWindow}, write 3-5 executive summary bullets that identify the key themes, notable shifts, and strategic implications for Canada's AI ecosystem.

Articles:
${articleList}

Respond with ONLY a JSON array of strings, e.g. ["Bullet one.", "Bullet two.", "Bullet three."]`;

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
        });

        clearTimeout(timer);

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(`[hf-summarize] HF API error ${res.status}: ${text}`);
            return null;
        }

        const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
        };

        const raw = data?.choices?.[0]?.message?.content?.trim();
        if (!raw) {
            console.warn("[hf-summarize] Empty response from HF API.");
            return null;
        }

        // Parse the JSON array from the response
        const bullets = parseJsonArray(raw);
        if (!bullets || bullets.length === 0) {
            console.warn("[hf-summarize] Could not parse bullets from response:", raw);
            return null;
        }

        return bullets.slice(0, 5);
    } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
            console.warn("[hf-summarize] Request timed out after", TIMEOUT_MS, "ms.");
        } else {
            console.error("[hf-summarize] Unexpected error:", err);
        }
        return null;
    }
}

/**
 * Attempt to extract a JSON string array from possibly noisy LLM output.
 * Handles cases where the model wraps the array in markdown code fences.
 */
function parseJsonArray(raw: string): string[] | null {
    // Strip markdown code fences if present
    let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    // Find first `[` and last `]`
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) return null;

    cleaned = cleaned.slice(start, end + 1);

    try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
            return parsed as string[];
        }
        return null;
    } catch {
        return null;
    }
}
