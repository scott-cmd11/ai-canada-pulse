// frontend/src/lib/digest-client.ts
// Generates and retrieves daily AI digests.
// Generation is called by the cron job; retrieval is called by API routes and pages.
// Reads Redis directly (no unstable_cache) to avoid caching pre-cron misses.

import { Redis } from '@upstash/redis'
import type { DailyDigest, DigestTag } from './digest-types'

const OPENAI_MODEL = process.env.OPENAI_BRIEF_MODEL ?? 'gpt-4o-mini'
const TIMEOUT_MS = 30_000
const DIGEST_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('Digest Redis is not configured')
  }
  return new Redis({ url, token })
}

function redisKey(date: string) {
  return `digest:${date}`
}

/**
 * Retrieve a digest from Redis. Returns null if not yet generated.
 * Throws if Redis is unavailable (callers must handle this for fallback rendering).
 */
export async function getDigest(date: string): Promise<DailyDigest | null> {
  const redis = getRedis()
  const raw = await redis.get<DailyDigest>(redisKey(date))
  return raw ?? null
}

/** Store a digest in Redis with 90-day TTL. */
export async function saveDigest(digest: DailyDigest): Promise<void> {
  const redis = getRedis()
  await redis.set(redisKey(digest.date), digest, { ex: DIGEST_TTL_SECONDS })
}

/** Store an error sentinel so pages know the cron ran but failed.
 *  Never overwrites a previously successful digest for the same day. */
export async function saveDigestError(date: string, reason = 'Digest generation failed', stage = 'digest'): Promise<void> {
  const redis = getRedis()
  const existing = await redis.get<DailyDigest>(redisKey(date))
  if (existing && !existing.error) return // keep the good digest
  const sentinel: Partial<DailyDigest> = {
    date,
    error: true,
    errorReason: reason,
    errorStage: stage,
    generatedAt: new Date().toISOString(),
  }
  await redis.set(redisKey(date), sentinel, { ex: DIGEST_TTL_SECONDS })
}

/**
 * Generate a daily digest from the top RSS stories.
 * Called by the cron job after fetching stories.
 * Returns null if generation fails (caller should store error sentinel).
 */
export async function generateDigest(
  stories: { headline: string; summary: string; sourceName: string; sourceUrl: string; category: string }[],
  date: string
): Promise<DailyDigest | null> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const top = stories.slice(0, 10)
  if (top.length === 0) throw new Error('No stories available for digest generation')

  const storiesText = top
    .map((s, i) => `${i + 1}. [${s.sourceName}] ${s.headline}\n   URL: ${s.sourceUrl}\n   ${s.summary}`)
    .join('\n\n')

  const systemPrompt = `You are an editorial analyst for AI Canada Pulse, a site tracking AI developments in Canada.
Your job is to write a concise daily digest for Canadian professionals who want to scan what happened in Canadian AI today in under 3 minutes.
Be analytical and specific — name companies, bills, institutions. Avoid vague generalities.
Use Canadian English spelling (e.g. "centre" not "center", "colour" not "color", "labour" not "labor", "defence" not "defense").
Respond ONLY with valid JSON matching the schema provided. No markdown, no explanation.`

  const userPrompt = `Today's date: ${date}
Today's top Canadian AI news stories:

${storiesText}

Write a daily digest as JSON with this exact schema:
{
  "headline": "One punchy sentence capturing the most important theme today",
  "intro": "2–3 sentence paragraph setting the narrative tone. Be specific.",
  "developments": [
    { "text": "1–2 sentence bullet describing a specific development", "tag": "Policy|Research|Funding|Markets|Regulation|Talent" }
  ],
  "topStories": [
    { "headline": "exact headline from input", "url": "exact url from input", "source": "exact source from input" }
  ]
}

Rules:
- developments: 3–5 items, each with a tag from the allowed set
- topStories: pick the 3 most important, use exact text from the input
- Do not invent facts not present in the stories
- Tone: newsletter editorial, not press release`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 1000,
        ...(OPENAI_MODEL.startsWith('gpt-5') ? { reasoning_effort: 'minimal' } : {}),
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown')
      console.error(`[digest-client] OpenAI error ${response.status}: ${errText.slice(0, 200)}`)
      throw new Error(`OpenAI API returned ${response.status}`)
    }

    const data = await response.json()
    let content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI response did not include message content')

    if (typeof content !== 'string') {
      if (Array.isArray(content)) {
        content = content
          .map((part: { text?: string } | string) => {
            if (typeof part === 'string') return part
            if (typeof part?.text === 'string') return part.text
            return ''
          })
          .join('')
          .trim()
        if (!content) throw new Error('OpenAI response content was empty')
      } else {
        console.error('[digest-client] Unexpected content type:', typeof content)
        throw new Error(`Unexpected OpenAI content type: ${typeof content}`)
      }
    }

    // Strip markdown code fences if model wraps response (e.g. ```json ... ```)
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const parsed = JSON.parse(cleaned)

    // Validate required fields before constructing digest
    if (!parsed.headline || !parsed.intro || !Array.isArray(parsed.developments)) {
      console.error('[digest-client] LLM response missing required fields')
      throw new Error('OpenAI digest response missing required fields')
    }

    // Derive unique tags from developments
    const tags: DigestTag[] = Array.from(new Set(parsed.developments.map((d: { tag: DigestTag }) => d.tag)))

    const digest: DailyDigest = {
      date,
      headline: parsed.headline,
      intro: parsed.intro,
      developments: parsed.developments,
      tags,
      topStories: (parsed.topStories ?? []).slice(0, 3),
      generatedAt: new Date().toISOString(),
    }

    return digest
  } catch (err) {
    console.error('[digest-client] Generation failed:', err)
    throw err instanceof Error ? err : new Error('Digest generation failed')
  }
}
