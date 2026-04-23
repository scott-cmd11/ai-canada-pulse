// frontend/src/lib/deep-dive-client.ts
// Significance detection + AI generation + Redis storage for deep-dive blog posts.
// Detection is rule-based (cheap). Generation only fires when a threshold is crossed.

import { Redis } from '@upstash/redis'
import type { DeepDive, DeepDiveIndexEntry, DigestTag } from './digest-types'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const OPENAI_MODEL = process.env.OPENAI_BRIEF_MODEL ?? 'gpt-4o-mini'
const TIMEOUT_MS = 35_000
const DEEP_DIVE_INDEX_KEY = 'deepdive:index'

type Story = {
  headline: string
  summary: string
  sourceName: string
  sourceUrl: string
  category: string
}

type SignificantStory = {
  story: Story
  reason: string
  priority: number // higher = more significant
}

// ---------------------------------------------------------------------------
// Significance detection
// ---------------------------------------------------------------------------

const FUNDING_PATTERN = /\$(\d+)\s*([MB])/i
const PARLIAMENT_BILL_PATTERN = /\b(bill|loi)\s+[CS]-\d+/i
const PARLIAMENT_VOTE_PATTERN = /\b(vote[sd]?|passed|tabled|introduced|third reading)\b/i
const AI_KEYWORDS = /\b(AI|artificial intelligence|machine learning|LLM|foundation model)\b/i

function detectSignificantStory(stories: Story[]): SignificantStory | null {
  let best: SignificantStory | null = null

  for (const story of stories) {
    const text = `${story.headline} ${story.summary}`

    // Priority 3: Funding round ≥ $50M
    const fundingMatch = text.match(FUNDING_PATTERN)
    if (fundingMatch) {
      const amount = parseInt(fundingMatch[1])
      const unit = fundingMatch[2].toUpperCase()
      const millions = unit === 'B' ? amount * 1000 : amount
      if (millions >= 25 && AI_KEYWORDS.test(text)) {
        const candidate: SignificantStory = {
          story,
          reason: `Canadian AI funding round ≥ $25M: ${story.headline}`,
          priority: 3,
        }
        if (!best || candidate.priority > best.priority) best = candidate
      }
    }

    // Priority 2: Parliament bill or vote on AI legislation
    if (
      (PARLIAMENT_BILL_PATTERN.test(text) || PARLIAMENT_VOTE_PATTERN.test(text)) &&
      AI_KEYWORDS.test(text)
    ) {
      const candidate: SignificantStory = {
        story,
        reason: `Parliamentary AI legislation activity: ${story.headline}`,
        priority: 2,
      }
      if (!best || candidate.priority > best.priority) best = candidate
    }

    // Priority 1: Research category story (arXiv equivalent — Canadian research)
    if (story.category === 'Research' && AI_KEYWORDS.test(text)) {
      const candidate: SignificantStory = {
        story,
        reason: `Significant Canadian AI research: ${story.headline}`,
        priority: 1,
      }
      if (!best || candidate.priority > best.priority) best = candidate
    }
  }

  return best
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/-$/, '')
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let counter = 2
  while (counter <= 10) {
    const exists = await redis.exists(`deepdive:${slug}`)
    if (!exists) return slug
    slug = `${base}-${counter}`
    counter++
  }
  throw new Error(`Could not generate unique slug for base: ${base}`)
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

async function generateDeepDive(
  sig: SignificantStory,
  allStories: Story[],
  date: string,
  skipQualityChecks = false
): Promise<DeepDive | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[deep-dive-client] No OPENAI_API_KEY configured')
    return null
  }

  // Include the significant story + up to 3 related stories for context
  const related = allStories
    .filter((s) => s !== sig.story)
    .slice(0, 3)
  const context = [sig.story, ...related]
    .map((s, i) => `${i + 1}. [${s.sourceName}] ${s.headline}\n   URL: ${s.sourceUrl}\n   ${s.summary}`)
    .join('\n\n')

  const systemPrompt = `You are an analytical writer for AI Canada Pulse.
Write deep-dive analysis posts (400–600 words) about significant Canadian AI developments.
Your tone is like a thoughtful newsletter column: analytical, specific, opinionated.
Explain IMPLICATIONS — not just what happened, but what it means for Canadian AI.
Respond ONLY with valid JSON. No markdown fences, no explanation outside the JSON.`

  const userPrompt = `Date: ${date}
Trigger: ${sig.reason}

Context stories:
${context}

Write a deep-dive analysis post as JSON:
{
  "title": "Punchy, specific title (not a question)",
  "body": "400–600 words of analytical prose in markdown. Use paragraphs. Include one blockquote callout prefixed with > for the key insight.",
  "tags": ["Policy|Research|Funding|Markets|Regulation|Talent"]
}

Rules:
- Body must be 400–600 words. Count carefully.
- Name specific companies, institutions, dollar amounts, bill numbers
- tags: 1–3 tags from the allowed set
- Do not fabricate facts not in the source stories`

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
        max_completion_tokens: 1200,
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown')
      console.error(`[deep-dive-client] OpenAI error ${response.status}: ${errText.slice(0, 200)}`)
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') return null

    const parsed = JSON.parse(content)

    // Validate required fields
    if (!parsed.title || !parsed.body || !Array.isArray(parsed.tags)) {
      console.error('[deep-dive-client] LLM response missing required fields')
      return null
    }

    // Quality check 1: body must be ≥ 300 words
    const wordCount = parsed.body.split(/\s+/).length
    if (wordCount < 300) {
      console.warn(`[deep-dive-client] Body too short (${wordCount} words), discarding`)
      return null
    }

    // Quality check 2: body must reference ≥ 1 of the source headlines
    // Skipped in force/seed mode since we bypass threshold selection.
    if (!skipQualityChecks) {
      const sourceContext = [sig.story, ...related]
      const headlineMatches = sourceContext.filter((s) =>
        parsed.body.toLowerCase().includes(s.headline.slice(0, 25).toLowerCase())
      ).length
      if (headlineMatches < 1) {
        console.warn(`[deep-dive-client] Body references no source headlines, discarding`)
        return null
      }
    }

    const readingTimeMinutes = Math.ceil(wordCount / 200)
    const baseSlug = `${slugify(parsed.title)}-${date}`
    const slug = await uniqueSlug(baseSlug)

    const deepDive: DeepDive = {
      slug,
      title: parsed.title,
      body: parsed.body,
      tags: parsed.tags as DigestTag[],
      sources: [sig.story, ...related].map((s) => ({
        headline: s.headline,
        url: s.sourceUrl,
        source: s.sourceName,
      })),
      triggeredBy: sig.reason,
      readingTimeMinutes,
      generatedAt: new Date().toISOString(),
      date,
    }

    return deepDive
  } catch (err) {
    console.error('[deep-dive-client] Generation failed:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Force generation from the best available story, bypassing the significance threshold. */
export async function forceGenerateDeepDive(
  stories: Story[],
  date: string
): Promise<string | null> {
  if (stories.length === 0) return null

  // Pick the first Research story, or fall back to the first story overall
  const best = stories.find((s) => s.category === 'Research') ?? stories[0]
  const sig: SignificantStory = {
    story: best,
    reason: `Seeded: ${best.headline}`,
    priority: 0,
  }

  const deepDive = await generateDeepDive(sig, stories, date, true)
  if (!deepDive) return null

  await redis.set(`deepdive:${deepDive.slug}`, deepDive)
  const entry: DeepDiveIndexEntry = {
    slug: deepDive.slug,
    title: deepDive.title,
    tags: deepDive.tags,
    date: deepDive.date,
    triggeredBy: deepDive.triggeredBy,
    readingTimeMinutes: deepDive.readingTimeMinutes,
  }
  await redis.zadd(DEEP_DIVE_INDEX_KEY, { score: Date.now(), member: JSON.stringify(entry) })

  return deepDive.slug
}

/** Run significance detection + optional generation. Returns slug if generated, null otherwise. */
export async function detectAndGenerateDeepDive(
  stories: Story[],
  date: string
): Promise<string | null> {
  const sig = detectSignificantStory(stories)
  if (!sig) return null

  console.log(`[deep-dive-client] Threshold crossed: ${sig.reason}`)

  const deepDive = await generateDeepDive(sig, stories, date)
  if (!deepDive) return null

  // Store the post
  await redis.set(`deepdive:${deepDive.slug}`, deepDive)

  // Add to sorted index (score = unix timestamp for chronological ordering)
  const entry: DeepDiveIndexEntry = {
    slug: deepDive.slug,
    title: deepDive.title,
    tags: deepDive.tags,
    date: deepDive.date,
    triggeredBy: deepDive.triggeredBy,
    readingTimeMinutes: deepDive.readingTimeMinutes,
  }
  await redis.zadd(DEEP_DIVE_INDEX_KEY, {
    score: Date.now(),
    member: JSON.stringify(entry),
  })

  return deepDive.slug
}

/** Retrieve a single deep-dive by slug. */
export async function getDeepDive(slug: string): Promise<DeepDive | null> {
  try {
    return await redis.get<DeepDive>(`deepdive:${slug}`)
  } catch {
    return null
  }
}

/** Retrieve paginated deep-dive index entries (newest first). */
export async function listDeepDives(
  limit = 10,
  offset = 0
): Promise<DeepDiveIndexEntry[]> {
  try {
    const raw = await redis.zrange(DEEP_DIVE_INDEX_KEY, offset, offset + limit - 1, {
      rev: true,
    })
    // Upstash auto-parses JSON values — handle both string and pre-parsed object
    return raw.map((r) =>
      (typeof r === 'string' ? JSON.parse(r) : r) as DeepDiveIndexEntry
    )
  } catch {
    return []
  }
}
