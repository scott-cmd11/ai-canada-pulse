/**
 * Topic tagger — assigns one or more topic slugs from lib/topics.ts to each story.
 *
 * Hybrid pipeline:
 *   1. Regex pre-filter over keywordSeeds — fast, free, high-precision for obvious hits.
 *   2. LLM fallback (gpt-5-nano) only for stories that got zero regex matches.
 *
 * Output: Map<headline, string[]>  (slug array, may be empty).
 * Merged into the enrichment bundle alongside per-story summaries.
 */

import { TOPICS, getAllTopicSlugs } from "./topics"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ""
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions"
const TOPIC_TAGGER_MODEL = process.env.OPENAI_TAGGER_MODEL ?? "gpt-5-nano"
const TIMEOUT_MS = 20_000

interface StoryForTagging {
  id: string
  headline: string
  snippet?: string
  category?: string
}

// Precompile one RegExp per topic. Word-boundary match, case-insensitive.
// Escapes regex metacharacters in seeds so ampersands/parens in seeds are literal.
function escapeRegex(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const TOPIC_PATTERNS: Array<{ slug: string; pattern: RegExp }> = TOPICS.map((t) => {
  const alternation = t.keywordSeeds.map(escapeRegex).join("|")
  // \b works for alphanumeric seeds; seeds like "C-27" rely on the surrounding
  // non-word character boundary which \b still handles correctly on the letters.
  return { slug: t.slug, pattern: new RegExp(`\\b(?:${alternation})\\b`, "i") }
})

function regexTagsFor(haystack: string): string[] {
  const matched: string[] = []
  for (const { slug, pattern } of TOPIC_PATTERNS) {
    if (pattern.test(haystack)) matched.push(slug)
  }
  return matched
}

async function callTaggerAI(
  systemPrompt: string,
  userPrompt: string,
  maxCompletionTokens = 200,
): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    console.error("[topic-tagger] ABORT: OPENAI_API_KEY env var is not set — ambiguous stories will get no topic tags")
    return null
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const requestBody: Record<string, unknown> = {
      model: TOPIC_TAGGER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: maxCompletionTokens,
    }

    if (TOPIC_TAGGER_MODEL.startsWith("gpt-5")) {
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
      console.error(`[topic-tagger] OpenAI ${res.status} ${res.statusText}: ${errText.slice(0, 300)}`)
      return null
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content === "string" && content.trim()) return content.trim()
    return null
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error(`[topic-tagger] OpenAI request timed out after ${TIMEOUT_MS}ms`)
    } else {
      console.error("[topic-tagger] OpenAI fetch failed:", err)
    }
    return null
  }
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

const VALID_SLUGS = new Set(getAllTopicSlugs())

function sanitizeSlugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item === "string" && VALID_SLUGS.has(item) && !out.includes(item)) {
      out.push(item)
    }
    if (out.length >= 3) break
  }
  return out
}

/**
 * Ask the LLM to assign 0–3 topic slugs to each unresolved headline in one call.
 * Returns a map of headline → slug[]. Missing or invalid responses yield [].
 */
async function resolveAmbiguousBatch(
  stories: StoryForTagging[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>()
  if (stories.length === 0 || !OPENAI_API_KEY) return result

  const topicCatalog = TOPICS.map(
    (t) => `- ${t.slug} · ${t.label} — ${t.shortDescription}`,
  ).join("\n")

  const articleBlock = stories
    .map((s, i) => {
      const snippet = (s.snippet ?? "").slice(0, 180)
      return `${i + 1}. Headline: "${s.headline}"${snippet ? `\n   Context: ${snippet}` : ""}`
    })
    .join("\n\n")

  const systemPrompt = `You are a Canadian AI news classifier. For each article, choose 0 to 3 topic slugs from the provided catalog that best describe it.

Rules:
- Only use slugs that appear in the catalog. No invented slugs.
- Prefer 1 slug. Use 2 or 3 only when an article genuinely spans multiple topics.
- Return an empty array for articles that don't clearly fit any topic — do not force-fit.
- An article must be *about* the topic, not merely mention it in passing.

Output ONLY a JSON object mapping item number (as string) to slug array.
Example: {"1": ["aida"], "2": [], "3": ["compute-capacity", "ai-investment-funding"]}`

  const userPrompt = `Catalog:\n${topicCatalog}\n\nArticles:\n${articleBlock}\n\nJSON object:`

  const raw = await callTaggerAI(systemPrompt, userPrompt, Math.min(1000, 80 + stories.length * 40))
  if (!raw) return result

  const parsed = parseJsonObject(raw)
  if (!parsed) return result

  stories.forEach((s, i) => {
    const slugs = sanitizeSlugs(parsed[String(i + 1)])
    result.set(s.id, slugs)
  })

  return result
}

/**
 * Tag a batch of stories with topic slugs.
 * Regex-first; LLM only runs on stories with zero regex hits.
 * Safe to call with [] (returns empty map). Safe with no API key (regex-only mode).
 */
export async function tagStoryTopics(
  stories: StoryForTagging[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>()
  if (stories.length === 0) return result

  const ambiguous: StoryForTagging[] = []

  for (const story of stories) {
    const haystack = `${story.headline} ${story.snippet ?? ""}`
    const regexHits = regexTagsFor(haystack)
    if (regexHits.length > 0) {
      result.set(story.id, regexHits)
    } else {
      ambiguous.push(story)
    }
  }

  const regexHitCount = stories.length - ambiguous.length
  console.log(
    `[topic-tagger] ${stories.length} stories in · ${regexHitCount} matched by regex · ${ambiguous.length} ambiguous`,
  )

  if (ambiguous.length > 0 && OPENAI_API_KEY) {
    // Cap LLM work per refresh to protect token budget; anything past the cap gets [].
    const LLM_CAP = 40
    const llmBatch = ambiguous.slice(0, LLM_CAP)
    const llmTags = await resolveAmbiguousBatch(llmBatch)
    let llmHitCount = 0
    for (const story of ambiguous) {
      const tags = llmTags.get(story.id) ?? []
      if (tags.length > 0) llmHitCount++
      result.set(story.id, tags)
    }
    console.log(`[topic-tagger] LLM resolved ${llmHitCount}/${ambiguous.length} ambiguous stories with ≥1 tag`)
  } else {
    for (const story of ambiguous) {
      result.set(story.id, [])
    }
    if (ambiguous.length > 0 && !OPENAI_API_KEY) {
      console.error(
        `[topic-tagger] ${ambiguous.length} stories had no regex match and no OPENAI_API_KEY — they will get empty topic arrays`,
      )
    }
  }

  const totalWithTags = Array.from(result.values()).filter((t) => t.length > 0).length
  console.log(`[topic-tagger] Final: ${totalWithTags}/${stories.length} stories have ≥1 topic tag`)

  return result
}

// Exposed for tests / ad-hoc scripts — lets callers verify the regex half
// without paying for an LLM call.
export function tagStoryTopicsRegexOnly(
  stories: StoryForTagging[],
): Map<string, string[]> {
  const result = new Map<string, string[]>()
  for (const story of stories) {
    const haystack = `${story.headline} ${story.snippet ?? ""}`
    result.set(story.id, regexTagsFor(haystack))
  }
  return result
}
