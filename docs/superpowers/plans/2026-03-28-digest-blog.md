# Digest Homepage & AI Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the root redirect with a daily AI-generated digest homepage, add auto-generated deep-dive blog posts for significant stories, and streamline the dashboard from 18 open panels to 6 visible + 4 collapsible.

**Architecture:** Three independent subsystems built in sequence: (1) data layer — types, Redis clients, OpenAI generation; (2) API routes + generation pipeline hooked into existing cron; (3) UI — new pages, updated dashboard, updated nav. Each task commits independently so the build stays green throughout.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS 4, Upstash Redis (`@upstash/redis`), OpenAI gpt-4o-mini via direct fetch (matching `summarizer.ts` pattern). No test framework — verify each task with `npm run build`.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `frontend/src/lib/digest-types.ts` | **Create** | Shared TypeScript interfaces: `DailyDigest`, `DeepDive`, `DigestTag` |
| `frontend/src/lib/digest-client.ts` | **Create** | Redis read/write for daily digests + OpenAI generation |
| `frontend/src/lib/deep-dive-client.ts` | **Create** | Significance detection, deep-dive generation, Redis storage + retrieval |
| `frontend/src/app/api/v1/digest/route.ts` | **Create** | GET /api/v1/digest — serve today's or archived digest |
| `frontend/src/app/api/v1/deep-dives/route.ts` | **Create** | GET /api/v1/deep-dives — paginated list |
| `frontend/src/app/api/v1/deep-dives/[slug]/route.ts` | **Create** | GET /api/v1/deep-dives/[slug] — single post |
| `frontend/src/app/api/v1/ai-refresh/route.ts` | **Modify** | Add digest + deep-dive generation steps, bump maxDuration to 300 |
| `frontend/src/components/DigestView.tsx` | **Create** | Server Component — renders a DailyDigest (used by `/` and `/digest/[date]`) |
| `frontend/src/components/DeepDiveView.tsx` | **Create** | Server Component — renders a single DeepDive post |
| `frontend/src/components/CollapsibleSection.tsx` | **Create** | Client Component — accordion wrapper for collapsed dashboard panels |
| `frontend/src/app/page.tsx` | **Modify** | Replace redirect with digest homepage |
| `frontend/src/app/digest/[date]/page.tsx` | **Create** | Archive date page (reuses DigestView) |
| `frontend/src/app/blog/page.tsx` | **Create** | Blog index — lists all deep-dives + past digests |
| `frontend/src/app/blog/[slug]/page.tsx` | **Create** | Individual deep-dive post page |
| `frontend/src/app/dashboard/page.tsx` | **Modify** | Remove 9 panels, wrap 4 panels in CollapsibleSection |
| `frontend/src/components/Header.tsx` | **Modify** | Update nav: add Digest, Deep Dives links |

---

## Task 1: Shared TypeScript Interfaces

**Files:**
- Create: `frontend/src/lib/digest-types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// frontend/src/lib/digest-types.ts
// Shared types for the daily digest and deep-dive blog posts.
// Both DailyDigest and DeepDive use the same tag union so the /blog
// index can filter across both content types without type casting.

export type DigestTag =
  | 'Policy'
  | 'Research'
  | 'Funding'
  | 'Markets'
  | 'Regulation'
  | 'Talent'

export interface DailyDigest {
  date: string           // ISO date: "2026-03-28"
  headline: string       // 1 punchy sentence
  intro: string          // 2–3 sentence narrative paragraph
  developments: {
    text: string         // 1–2 sentence bullet
    tag: DigestTag
  }[]                    // 3–5 items
  tags: DigestTag[]      // unique tags derived from developments
  topStories: {
    headline: string
    url: string
    source: string
  }[]                    // max 3
  deepDiveSlug?: string  // set if a deep-dive was generated today
  generatedAt: string    // ISO timestamp
  error?: boolean        // sentinel: cron ran but generation failed
}

export interface DeepDive {
  slug: string
  title: string
  body: string           // 400–600 words markdown
  tags: DigestTag[]
  sources: { headline: string; url: string; source: string }[]
  triggeredBy: string    // e.g. "Funding round ≥ $50M: Cohere Series D"
  readingTimeMinutes: number
  generatedAt: string    // ISO timestamp
  date: string           // ISO date for archive display
}

// Lightweight summary stored in the deepdive:index sorted set value
export interface DeepDiveIndexEntry {
  slug: string
  title: string
  tags: DigestTag[]
  date: string
  triggeredBy: string
  readingTimeMinutes: number
}
```

- [ ] **Step 2: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully` (types-only file, no runtime impact)

- [ ] **Step 3: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/lib/digest-types.ts
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: add DailyDigest and DeepDive TypeScript interfaces"
```

---

## Task 2: digest-client.ts

Redis storage and retrieval for daily digests, plus OpenAI generation. Follows the same direct-fetch pattern as `summarizer.ts`.

**Files:**
- Create: `frontend/src/lib/digest-client.ts`

**Prerequisites:** Read `frontend/src/lib/summarizer.ts` to understand the OpenAI fetch pattern and timeout handling before implementing.

- [ ] **Step 1: Create digest-client.ts**

```typescript
// frontend/src/lib/digest-client.ts
// Generates and retrieves daily AI digests.
// Generation is called by the cron job; retrieval is called by API routes and pages.
// Reads Redis directly (no unstable_cache) to avoid caching pre-cron misses.

import { Redis } from '@upstash/redis'
import type { DailyDigest, DigestTag } from './digest-types'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const OPENAI_MODEL = process.env.OPENAI_BRIEF_MODEL ?? 'gpt-4o-mini'
const TIMEOUT_MS = 30_000
const DIGEST_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days

function redisKey(date: string) {
  return `digest:${date}`
}

/**
 * Retrieve a digest from Redis. Returns null if not yet generated.
 * Throws if Redis is unavailable (callers must handle this for fallback rendering).
 */
export async function getDigest(date: string): Promise<DailyDigest | null> {
  const raw = await redis.get<DailyDigest>(redisKey(date))
  return raw ?? null
}

/** Store a digest in Redis with 90-day TTL. */
export async function saveDigest(digest: DailyDigest): Promise<void> {
  await redis.set(redisKey(digest.date), digest, { ex: DIGEST_TTL_SECONDS })
}

/** Store an error sentinel so pages know the cron ran but failed. */
export async function saveDigestError(date: string): Promise<void> {
  const sentinel: Partial<DailyDigest> = { date, error: true, generatedAt: new Date().toISOString() }
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
  const top = stories.slice(0, 10)
  if (top.length === 0) return null

  const storiesText = top
    .map((s, i) => `${i + 1}. [${s.sourceName}] ${s.headline}\n   ${s.summary}`)
    .join('\n\n')

  const systemPrompt = `You are an editorial analyst for AI Canada Pulse, a site tracking AI developments in Canada.
Your job is to write a concise daily digest for Canadian professionals who want to scan what happened in Canadian AI today in under 3 minutes.
Be analytical and specific — name companies, bills, institutions. Avoid vague generalities.
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
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      console.error('[digest-client] OpenAI error:', response.status)
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)

    // Derive unique tags from developments
    const tags: DigestTag[] = [...new Set(parsed.developments.map((d: { tag: DigestTag }) => d.tag))]

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
    return null
  }
}
```

- [ ] **Step 2: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/lib/digest-client.ts
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: add digest-client — Redis storage and OpenAI generation for daily digest"
```

---

## Task 3: deep-dive-client.ts

Significance detection (rule-based, no LLM cost until threshold crossed), deep-dive generation, Redis storage and retrieval.

**Files:**
- Create: `frontend/src/lib/deep-dive-client.ts`

- [ ] **Step 1: Create deep-dive-client.ts**

```typescript
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
      if (millions >= 50 && AI_KEYWORDS.test(text)) {
        const candidate: SignificantStory = {
          story,
          reason: `Canadian AI funding round ≥ $50M: ${story.headline}`,
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
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await redis.zscore(DEEP_DIVE_INDEX_KEY, slug)
    if (exists === null) return slug
    slug = `${base}-${counter}`
    counter++
  }
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

async function generateDeepDive(
  sig: SignificantStory,
  allStories: Story[],
  date: string
): Promise<DeepDive | null> {
  // Include the significant story + up to 3 related stories for context
  const related = allStories
    .filter((s) => s !== sig.story)
    .slice(0, 3)
  const context = [sig.story, ...related]
    .map((s, i) => `${i + 1}. [${s.sourceName}] ${s.headline}\n   ${s.summary}`)
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
  "tags": ["Policy|Research|Funding|Markets|Regulation|Talent"],
  "pullQuote": "The single most important sentence from the body (for the callout box)"
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
      console.error('[deep-dive-client] OpenAI error:', response.status)
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)

    // Quality check 1: body must be ≥ 300 words
    const wordCount = parsed.body.split(/\s+/).length
    if (wordCount < 300) {
      console.warn(`[deep-dive-client] Body too short (${wordCount} words), discarding`)
      return null
    }

    // Quality check 2: body must reference ≥ 2 of the source headlines
    // Uses the first 25 characters of each headline as a fingerprint to avoid
    // false negatives when the LLM paraphrases slightly.
    const sourceContext = [sig.story, ...related]
    const headlineMatches = sourceContext.filter((s) =>
      parsed.body.toLowerCase().includes(s.headline.slice(0, 25).toLowerCase())
    ).length
    if (headlineMatches < 2) {
      console.warn(`[deep-dive-client] Body references only ${headlineMatches} source headline(s), discarding`)
      return null
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
    return raw.map((r) => JSON.parse(r as string) as DeepDiveIndexEntry)
  } catch {
    return []
  }
}
```

- [ ] **Step 2: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/lib/deep-dive-client.ts
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: add deep-dive-client — significance detection, AI generation, Redis storage"
```

---

## Task 4: API Routes

Three new routes. All read directly from Redis (no `unstable_cache`).

**Files:**
- Create: `frontend/src/app/api/v1/digest/route.ts`
- Create: `frontend/src/app/api/v1/deep-dives/route.ts`
- Create: `frontend/src/app/api/v1/deep-dives/[slug]/route.ts`

- [ ] **Step 1: Create digest route**

```typescript
// frontend/src/app/api/v1/digest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDigest } from '@/lib/digest-client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const date =
    request.nextUrl.searchParams.get('date') ??
    new Date().toISOString().split('T')[0]

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
  }

  const digest = await getDigest(date)
  if (!digest) {
    return NextResponse.json({ digest: null, state: 'pending' }, { status: 200 })
  }
  if (digest.error) {
    return NextResponse.json({ digest: null, state: 'error' }, { status: 200 })
  }

  return NextResponse.json({ digest, state: 'ready' })
}
```

- [ ] **Step 2: Create deep-dives list route**

```typescript
// frontend/src/app/api/v1/deep-dives/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { listDeepDives } from '@/lib/deep-dive-client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '10'), 50)
  // Note: spec uses `cursor=` but this implementation uses integer offset for simplicity
  // with Redis ZRANGE by index. The parameter is named `offset` in the API for clarity.
  const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0')

  const entries = await listDeepDives(limit, offset)
  return NextResponse.json({ entries, limit, offset })
}
```

- [ ] **Step 3: Create deep-dive single route**

```typescript
// frontend/src/app/api/v1/deep-dives/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDeepDive } from '@/lib/deep-dive-client'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const post = await getDeepDive(params.slug)
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ post })
}
```

- [ ] **Step 4: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -15
```

Expected: Routes appear in the build output. `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/app/api/v1/digest/route.ts frontend/src/app/api/v1/deep-dives/route.ts "frontend/src/app/api/v1/deep-dives/[slug]/route.ts"
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: add digest and deep-dives API routes"
```

---

## Task 5: Extend the Cron Job

Hook digest and deep-dive generation into the existing `/api/v1/ai-refresh` cron. Bump `maxDuration` to 300s.

**Files:**
- Modify: `frontend/src/app/api/v1/ai-refresh/route.ts`

- [ ] **Step 1: Read the current file**

Read `frontend/src/app/api/v1/ai-refresh/route.ts` to understand the full current implementation before editing.

- [ ] **Step 2: Update the cron route**

Replace the file content with:

```typescript
// frontend/src/app/api/v1/ai-refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { refreshDashboardEnrichmentBundle } from '@/lib/dashboard-enrichment'
import { fetchAllStories } from '@/lib/rss-client'
import { generateDigest, saveDigest, saveDigestError, getDigest } from '@/lib/digest-client'
import { detectAndGenerateDeepDive } from '@/lib/deep-dive-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // bumped from 60 to accommodate digest + deep-dive generation

function authorize(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const results: Record<string, unknown> = { date: today }

  // Step 1: Existing dashboard enrichment (summaries + executive brief)
  try {
    const enrichment = await refreshDashboardEnrichmentBundle()
    results.enrichment = {
      summaryCount: Object.keys(enrichment.canada?.summaries ?? {}).length,
      briefCount: enrichment.canada?.executiveBrief?.length ?? 0,
    }
  } catch (err) {
    console.error('[ai-refresh] Dashboard enrichment failed:', err)
    results.enrichmentError = true
  }

  // Step 2: Fetch stories for digest and deep-dive generation
  let stories: Awaited<ReturnType<typeof fetchAllStories>> = []
  try {
    stories = await fetchAllStories()
  } catch (err) {
    console.error('[ai-refresh] Story fetch failed:', err)
  }

  // Step 3: Generate daily digest
  try {
    const digest = await generateDigest(
      stories.map((s) => ({
        headline: s.headline,
        summary: s.summary ?? '',
        sourceName: s.sourceName ?? '',
        sourceUrl: s.sourceUrl ?? '',
        category: s.category,
      })),
      today
    )
    if (digest) {
      await saveDigest(digest)
      results.digest = 'generated'
    } else {
      await saveDigestError(today)
      results.digest = 'error'
    }
  } catch (err) {
    console.error('[ai-refresh] Digest generation failed:', err)
    await saveDigestError(today)
    results.digest = 'error'
  }

  // Step 4: Check significance + conditionally generate deep-dive
  try {
    const slug = await detectAndGenerateDeepDive(
      stories.map((s) => ({
        headline: s.headline,
        summary: s.summary ?? '',
        sourceName: s.sourceName ?? '',
        sourceUrl: s.sourceUrl ?? '',
        category: s.category,
      })),
      today
    )
    results.deepDive = slug ? `generated: ${slug}` : 'no threshold crossed'

    // Write the deep-dive slug back to today's digest so the homepage callout renders
    if (slug && results.digest === 'generated') {
      try {
        const existingDigest = await getDigest(today)
        if (existingDigest && !existingDigest.error) {
          await saveDigest({ ...existingDigest, deepDiveSlug: slug })
          results.deepDiveLinked = true
        }
      } catch (err) {
        console.error('[ai-refresh] Failed to update digest with deepDiveSlug:', err)
      }
    }
  } catch (err) {
    console.error('[ai-refresh] Deep-dive generation failed:', err)
    results.deepDive = 'error'
  }

  return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), ...results })
}
```

- [ ] **Step 3: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/app/api/v1/ai-refresh/route.ts
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: extend cron job with digest and deep-dive generation, bump maxDuration to 300s"
```

---

## Task 6: DigestView Component

Server Component that renders a `DailyDigest`. Used by both `/` and `/digest/[date]`.

**Files:**
- Create: `frontend/src/components/DigestView.tsx`

**Prerequisites:** Check `frontend/src/app/globals.css` for `.saas-card` and CSS variable names before implementing. The component must use `var(--text-primary)`, `var(--surface-primary)`, etc. — not Tailwind `dark:` prefixes.

- [ ] **Step 1: Create DigestView.tsx**

```tsx
// frontend/src/components/DigestView.tsx
// Server Component — renders a DailyDigest.
// Used by the homepage (/) and archive pages (/digest/[date]).
// No client state — all data is passed as props from the Server Component parent.

import Link from 'next/link'
import type { DailyDigest } from '@/lib/digest-types'

const TAG_COLORS: Record<string, string> = {
  Policy: '#3b82f6',
  Research: '#8b5cf6',
  Funding: '#10b981',
  Markets: '#f59e0b',
  Regulation: '#ef4444',
  Talent: '#06b6d4',
}

function TagBadge({ tag }: { tag: string }) {
  const color = TAG_COLORS[tag] ?? '#6b7280'
  return (
    <span
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, var(--surface-primary))`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 20%, var(--surface-primary))`,
        borderRadius: '4px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      {tag}
    </span>
  )
}

interface Props {
  digest: DailyDigest
  isToday: boolean
}

export default function DigestView({ digest, isToday }: Props) {
  const displayDate = new Date(digest.date + 'T12:00:00Z').toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  // Compute previous and next date strings for archive nav
  const currentDate = new Date(digest.date + 'T12:00:00Z')
  const prevDate = new Date(currentDate)
  prevDate.setUTCDate(prevDate.getUTCDate() - 1)
  const nextDate = new Date(currentDate)
  nextDate.setUTCDate(nextDate.getUTCDate() + 1)
  const prevISO = prevDate.toISOString().split('T')[0]
  const nextISO = nextDate.toISOString().split('T')[0]
  const todayISO = new Date().toISOString().split('T')[0]
  const hasNext = nextISO <= todayISO && !isToday

  return (
    <article style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>
      {/* Date + heading */}
      <header style={{ padding: '32px 0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: '10px',
          }}
        >
          {displayDate} · {isToday ? 'Today\'s Digest' : 'Archive'}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}
        >
          {digest.headline}
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '16px',
          }}
        >
          {digest.intro}
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {digest.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </header>

      {/* Key Developments */}
      <section style={{ padding: '24px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            marginBottom: '16px',
          }}
        >
          Key Developments
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {digest.developments.map((dev, i) => {
            const color = TAG_COLORS[dev.tag] ?? '#6b7280'
            return (
              <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: color,
                    marginTop: '8px',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                  {dev.text}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Top Stories */}
      {digest.topStories.length > 0 && (
        <section style={{ padding: '24px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              marginBottom: '14px',
            }}
          >
            Top Stories
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {digest.topStories.map((story, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: '1px', background: 'var(--border-subtle)' }} />}
                <a
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <span>{story.headline}</span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    {story.source} →
                  </span>
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Deep Dive callout */}
      {digest.deepDiveSlug && (
        <section
          style={{
            padding: '16px 20px',
            margin: '0 -20px',
            backgroundColor: `color-mix(in srgb, var(--accent-primary) 6%, var(--surface-primary))`,
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '4px' }}>
            Deep Dive
          </p>
          <Link
            href={`/blog/${digest.deepDiveSlug}`}
            style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
          >
            Read today&apos;s in-depth analysis →
          </Link>
        </section>
      )}

      {/* Archive nav + Dashboard link */}
      <footer style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
        <Link href={`/digest/${prevISO}`} style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>
          ← {prevDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
        </Link>
        <Link href="/dashboard" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
          Explore Dashboard →
        </Link>
        {hasNext && (
          <Link href={`/digest/${nextISO}`} style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>
            {nextDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' })} →
          </Link>
        )}
      </footer>
    </article>
  )
}
```

- [ ] **Step 2: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/components/DigestView.tsx
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: add DigestView server component"
```

---

## Task 7: Homepage and Archive Pages

Replace the root redirect with the digest homepage. Create the archive date page.

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/digest/[date]/page.tsx`

- [ ] **Step 1: Replace root page.tsx**

```tsx
// frontend/src/app/page.tsx
import { Suspense } from 'react'
import { getDigest } from '@/lib/digest-client'
import { fetchAllStories } from '@/lib/rss-client'
import DigestView from '@/components/DigestView'
import Header from '@/components/Header'

export async function generateMetadata() {
  const today = new Date().toISOString().split('T')[0]
  try {
    const digest = await getDigest(today)
    return {
      title: digest?.headline ?? 'Today in Canadian AI — AI Canada Pulse',
      description: digest?.intro?.slice(0, 155) ?? 'Daily AI digest tracking developments across Canada.',
      openGraph: { type: 'website' },
    }
  } catch {
    return {
      title: 'Today in Canadian AI — AI Canada Pulse',
      description: 'Daily AI digest tracking developments across Canada.',
      openGraph: { type: 'website' },
    }
  }
}

async function DigestContent() {
  const today = new Date().toISOString().split('T')[0]

  // Three distinct states: pending (key missing), error sentinel (cron failed),
  // ready (normal render). A Redis outage (thrown error) triggers a headlines-only fallback.
  let digest = null
  let redisDown = false

  try {
    digest = await getDigest(today)
  } catch {
    redisDown = true
  }

  // Fallback: Redis is unavailable — fetch stories directly and show headlines only
  if (redisDown) {
    let stories: { headline: string; sourceUrl: string; sourceName: string }[] = []
    try {
      const raw = await fetchAllStories()
      stories = raw.slice(0, 8).map((s) => ({
        headline: s.headline,
        sourceUrl: s.sourceUrl ?? '',
        sourceName: s.sourceName ?? '',
      }))
    } catch {
      // If RSS also fails, stories stays empty
    }
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
          The digest is temporarily unavailable. Here are today&apos;s latest headlines:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {stories.map((s, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: '1px', background: 'var(--border-subtle)' }} />}
              <a
                href={s.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                <span>{s.headline}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginLeft: '12px', whiteSpace: 'nowrap' }}>{s.sourceName} →</span>
              </a>
            </div>
          ))}
        </div>
        <a href="/dashboard" style={{ display: 'block', marginTop: '20px', color: 'var(--accent-primary)', fontSize: '13px' }}>
          View the live dashboard →
        </a>
      </div>
    )
  }

  // Pending: cron hasn't run yet today
  if (!digest) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Today&apos;s digest is being prepared — check back after 12:00 UTC.
        </p>
        <a href="/dashboard" style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>
          View the live dashboard →
        </a>
      </div>
    )
  }

  // Error sentinel: cron ran but generation failed
  if (digest.error) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Today&apos;s digest is temporarily unavailable.
        </p>
        <a href="/dashboard" style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>
          View the live dashboard →
        </a>
      </div>
    )
  }

  return <DigestView digest={digest} isToday={true} />
}

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main style={{ paddingBottom: '60px' }}>
        <Suspense fallback={
          <div style={{ maxWidth: '680px', margin: '60px auto', padding: '0 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Loading today&apos;s digest…
          </div>
        }>
          <DigestContent />
        </Suspense>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create archive date page**

First create the directory:
```bash
mkdir -p "C:\Users\scott\code\ai-canada-pulse\frontend\src\app\digest\[date]"
```

Then create the file:

```tsx
// frontend/src/app/digest/[date]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDigest } from '@/lib/digest-client'
import DigestView from '@/components/DigestView'
import Header from '@/components/Header'

interface Props {
  params: { date: string }
}

export async function generateMetadata({ params }: Props) {
  try {
    const digest = await getDigest(params.date)
    return {
      title: digest?.headline ?? `Canadian AI — ${params.date}`,
      description: digest?.intro?.slice(0, 155) ?? `AI Canada Pulse digest for ${params.date}`,
      openGraph: { type: 'article' },
    }
  } catch {
    return {
      title: `Canadian AI — ${params.date}`,
      description: `AI Canada Pulse digest for ${params.date}`,
      openGraph: { type: 'article' },
    }
  }
}

async function ArchiveContent({ date }: { date: string }) {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()

  let digest = null
  try {
    digest = await getDigest(date)
  } catch {
    notFound()
  }
  if (!digest || digest.error) notFound()

  return <DigestView digest={digest} isToday={false} />
}

export default function ArchivePage({ params }: Props) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main style={{ paddingBottom: '60px' }}>
        <Suspense fallback={
          <div style={{ maxWidth: '680px', margin: '60px auto', padding: '0 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Loading digest…
          </div>
        }>
          <ArchiveContent date={params.date} />
        </Suspense>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -15
```

Expected: `/` and `/digest/[date]` appear in route table. `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/app/page.tsx "frontend/src/app/digest/[date]/page.tsx"
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: replace root redirect with digest homepage, add archive date page"
```

---

## Task 8: DeepDiveView Component

Server Component that renders a single `DeepDive` post.

**Files:**
- Create: `frontend/src/components/DeepDiveView.tsx`

- [ ] **Step 1: Create DeepDiveView.tsx**

```tsx
// frontend/src/components/DeepDiveView.tsx
// Server Component — renders a single DeepDive post.
// The body field is markdown — render it as HTML using a simple split-by-paragraph approach.
// No markdown library needed: body uses only paragraphs and blockquotes (> prefix).

import Link from 'next/link'
import type { DeepDive } from '@/lib/digest-types'

const TAG_COLORS: Record<string, string> = {
  Policy: '#3b82f6',
  Research: '#8b5cf6',
  Funding: '#10b981',
  Markets: '#f59e0b',
  Regulation: '#ef4444',
  Talent: '#06b6d4',
}

function renderBody(body: string) {
  // Split by double newline into paragraphs. Handle blockquotes (lines starting with >).
  const paragraphs = body.split(/\n\n+/).filter(Boolean)
  return paragraphs.map((para, i) => {
    const isBlockquote = para.startsWith('>')
    const text = isBlockquote ? para.replace(/^>\s*/gm, '') : para
    if (isBlockquote) {
      return (
        <blockquote
          key={i}
          style={{
            borderLeft: '3px solid var(--accent-primary)',
            padding: '12px 16px',
            margin: '20px 0',
            backgroundColor: `color-mix(in srgb, var(--accent-primary) 6%, var(--surface-primary))`,
            borderRadius: '0 6px 6px 0',
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: 1.65,
          }}
        >
          {text}
        </blockquote>
      )
    }
    return (
      <p key={i} style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.75, marginBottom: '16px' }}>
        {text}
      </p>
    )
  })
}

export default function DeepDiveView({ post }: { post: DeepDive }) {
  const displayDate = new Date(post.date + 'T12:00:00Z').toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <article style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>
      {/* Back link */}
      <div style={{ padding: '24px 0 0' }}>
        <Link href="/" style={{ fontSize: '13px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
          ← Back to today&apos;s digest
        </Link>
      </div>

      {/* Post header */}
      <header style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {post.tags.map((tag) => {
            const color = TAG_COLORS[tag] ?? '#6b7280'
            return (
              <span
                key={tag}
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 12%, var(--surface-primary))`,
                  color,
                  border: `1px solid color-mix(in srgb, ${color} 20%, var(--surface-primary))`,
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            )
          })}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 3.5vw, 32px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}
        >
          {post.title}
        </h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          <span>{post.readingTimeMinutes} min read</span>
          <span>AI-generated</span>
          <span>{displayDate}</span>
        </div>
      </header>

      {/* Body */}
      <section style={{ padding: '24px 0' }}>
        {renderBody(post.body)}
      </section>

      {/* Sources */}
      {post.sources.length > 0 && (
        <section style={{ padding: '20px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
            Sources
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {post.sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: 'var(--accent-primary)', textDecoration: 'none' }}
              >
                {source.source} — {source.headline}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Transparency note */}
      <div
        style={{
          margin: '0 0 32px',
          padding: '12px 16px',
          backgroundColor: 'var(--surface-secondary)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          lineHeight: 1.6,
        }}
      >
        This post was auto-generated because this story crossed our significance threshold:{' '}
        <em>{post.triggeredBy}</em>.{' '}
        <Link href="/methodology" style={{ color: 'var(--accent-primary)' }}>
          Learn how this works →
        </Link>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/components/DeepDiveView.tsx
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: add DeepDiveView server component"
```

---

## Task 9: Blog Pages

Blog index (`/blog`) and individual deep-dive page (`/blog/[slug]`).

**Files:**
- Create: `frontend/src/app/blog/page.tsx`
- Create: `frontend/src/app/blog/[slug]/page.tsx`

- [ ] **Step 1: Create blog directory structure**

```bash
mkdir -p "C:\Users\scott\code\ai-canada-pulse\frontend\src\app\blog\[slug]"
```

- [ ] **Step 2: Create blog index page**

```tsx
// frontend/src/app/blog/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { listDeepDives } from '@/lib/deep-dive-client'
import Header from '@/components/Header'

export async function generateMetadata() {
  return {
    title: 'Deep Dives — AI Canada Pulse',
    description: 'Auto-generated in-depth analysis of significant Canadian AI developments.',
    openGraph: { type: 'website' },
  }
}

async function BlogList() {
  const entries = await listDeepDives(20, 0)

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
        No deep dives yet — check back after a significant Canadian AI story breaks.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {entries.map((entry, i) => {
        const displayDate = new Date(entry.date + 'T12:00:00Z').toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        })
        return (
          <div key={entry.slug}>
            {i > 0 && <div style={{ height: '1px', background: 'var(--border-subtle)' }} />}
            <Link
              href={`/blog/${entry.slug}`}
              style={{ display: 'block', padding: '20px 0', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                {entry.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    {tag}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                {entry.title}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {displayDate} · {entry.readingTimeMinutes} min read · AI-generated
              </p>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px 60px' }}>
        <header style={{ padding: '32px 0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '8px' }}>
            Deep Dives
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            In-Depth Analysis
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Auto-generated when a significant Canadian AI story crosses our detection threshold. One per day, maximum.
          </p>
        </header>
        <Suspense fallback={<div style={{ padding: '40px 0', color: 'var(--text-tertiary)', fontSize: '14px' }}>Loading…</div>}>
          <BlogList />
        </Suspense>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Create individual deep-dive page**

```tsx
// frontend/src/app/blog/[slug]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDeepDive } from '@/lib/deep-dive-client'
import DeepDiveView from '@/components/DeepDiveView'
import Header from '@/components/Header'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const post = await getDeepDive(params.slug)
  if (!post) return { title: 'Not Found' }
  const firstSentence = post.body.split(/[.!?]/)[0] + '.'
  return {
    title: `${post.title} — AI Canada Pulse`,
    description: firstSentence.slice(0, 155),
    openGraph: { type: 'article', publishedTime: post.generatedAt },
  }
}

async function PostContent({ slug }: { slug: string }) {
  const post = await getDeepDive(slug)
  if (!post) notFound()
  return <DeepDiveView post={post} />
}

export default function DeepDivePage({ params }: Props) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main style={{ paddingBottom: '60px' }}>
        <Suspense fallback={
          <div style={{ maxWidth: '680px', margin: '60px auto', padding: '0 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Loading…
          </div>
        }>
          <PostContent slug={params.slug} />
        </Suspense>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -15
```

Expected: `/blog` and `/blog/[slug]` appear in route table. `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/app/blog/page.tsx "frontend/src/app/blog/[slug]/page.tsx"
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: add blog index and deep-dive post pages"
```

---

## Task 10: Dashboard Streamlining

Remove 9 panels, wrap 4 panels in a collapsible accordion, keep 6 always visible.

**Files:**
- Create: `frontend/src/components/CollapsibleSection.tsx`
- Modify: `frontend/src/app/dashboard/page.tsx`

- [ ] **Step 1: Read the full dashboard page**

Read `frontend/src/app/dashboard/page.tsx` to understand the exact component names and section structure before editing.

- [ ] **Step 2: Create CollapsibleSection component**

```tsx
// frontend/src/components/CollapsibleSection.tsx
'use client'
// Accordion wrapper for dashboard panels that are collapsed by default.
// State is intentionally NOT persisted — each visit starts collapsed.

import { useState } from 'react'

interface Props {
  title: string
  children: React.ReactNode
}

export default function CollapsibleSection({ title, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span
          style={{
            fontSize: '16px',
            color: 'var(--text-tertiary)',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
            display: 'inline-block',
          }}
        >
          ›
        </span>
      </button>
      {isOpen && (
        <div style={{ paddingBottom: '24px' }}>
          {children}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update dashboard/page.tsx**

Read the file first, then apply these changes:

**Remove these imports entirely** (components to cut):
- `ExecutiveBriefSection`
- `ComputeStatusSection`
- `LabFeedsSection`
- `EpochAISection`
- `HuggingFaceSection`
- `GovRegistrySection`
- `OecdSection`
- `TalentEducationSection`
- `ProvinceIndex` / `ProvinceIndexSection`

**Add this import:**
```tsx
import CollapsibleSection from '@/components/CollapsibleSection'
```

**Remove these JSX elements** from the page body:
- `<ExecutiveBriefSection />` and its `<SectionErrorBoundary>` wrapper
- `<ComputeStatusSection />`
- `<LabFeedsSection />`
- `<EpochAISection />`
- `<HuggingFaceSection />`
- `<GovRegistrySection />`
- `<OecdSection />`
- `<TalentEducationSection />`
- Any `<ProvinceIndex />` or `<ProvinceIndexSection />` usage

**Wrap these 4 sections** in `<CollapsibleSection>`:
```tsx
<CollapsibleSection title="Research & Open Source">
  <SectionErrorBoundary>
    <ResearchSection />
  </SectionErrorBoundary>
  <SectionErrorBoundary>
    <OpenSourceSection />
  </SectionErrorBoundary>
</CollapsibleSection>

<CollapsibleSection title="AI Adoption Trends">
  <SectionErrorBoundary>
    <TrendsSection />
  </SectionErrorBoundary>
  <SectionErrorBoundary>
    <TrendsInsightsSection />
  </SectionErrorBoundary>
</CollapsibleSection>

<CollapsibleSection title="Ecosystem & Startups">
  <SectionErrorBoundary>
    <EcosystemSection />
  </SectionErrorBoundary>
</CollapsibleSection>

<CollapsibleSection title="Regulatory & Global Standing">
  <SectionErrorBoundary>
    <RegulatorySection />
  </SectionErrorBoundary>
</CollapsibleSection>
```

**Keep these 6 sections always visible** (no wrapper changes needed):
- `StoryFeed`
- `IndicatorsSection` (Pulse Indicators)
- `StocksSection` (Market Performance)
- `ParliamentSection`
- `SentimentSection`
- `JobMarketSection`

- [ ] **Step 4: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -15
```

Expected: No missing component errors. `✓ Compiled successfully`

If you see "Module not found" for a removed component, check that it's fully removed from both imports and JSX.

- [ ] **Step 5: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/components/CollapsibleSection.tsx frontend/src/app/dashboard/page.tsx
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: streamline dashboard — 6 visible panels, 4 collapsible, 9 removed"
```

---

## Task 11: Navigation Update

Add Digest and Deep Dives links to the header nav.

**Files:**
- Modify: `frontend/src/components/Header.tsx`

- [ ] **Step 1: Read Header.tsx**

Read `frontend/src/components/Header.tsx` to see the exact nav structure and active link pattern.

- [ ] **Step 2: Update nav links**

In `Header.tsx`, update the navigation links array/elements to:

```tsx
// Replace the existing nav links with:
const navLinks = [
  { href: '/', label: 'Digest' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/blog', label: 'Deep Dives' },
  { href: '/provinces', label: 'Provinces' },
  { href: '/methodology', label: 'Methodology' },
]
```

If the header uses `pathname` from `usePathname()` for active state, update the active check so that `/` matches exactly (not prefix-matching all routes). The Digest link should be active only when `pathname === '/'` or `pathname.startsWith('/digest')`.

If the header doesn't use `usePathname` (it's a Server Component), apply active styling using the Next.js `<Link>` component without client state.

- [ ] **Step 3: Verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" add frontend/src/components/Header.tsx
git -C "C:\Users\scott\code\ai-canada-pulse" commit -m "feat: update header nav — add Digest and Deep Dives links"
```

---

## Task 12: Final Build, Push, and Smoke Test

- [ ] **Step 1: Full production build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -30
```

Expected: All routes listed, `✓ Compiled successfully`, no TypeScript errors.

New routes that should appear:
- `/` (digest homepage)
- `/digest/[date]`
- `/blog`
- `/blog/[slug]`
- `/api/v1/digest`
- `/api/v1/deep-dives`
- `/api/v1/deep-dives/[slug]`

- [ ] **Step 2: Push to main to trigger Vercel deploy**

```bash
git -C "C:\Users\scott\code\ai-canada-pulse" push origin main
```

- [ ] **Step 3: Manually trigger the cron to generate today's first digest**

Once deployed, hit the cron endpoint manually to generate today's digest:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://ai-canada-pulse.vercel.app/api/v1/ai-refresh
```

Or trigger it from the Vercel dashboard: Functions → ai-refresh → Invoke.

Expected response: `{ "ok": true, "digest": "generated", "deepDive": "..." }`

- [ ] **Step 4: Verify the homepage shows the digest**

Visit `https://ai-canada-pulse.vercel.app/` and confirm:
- Digest headline and intro are visible
- Key Developments bullets render
- Top Stories links are present
- Archive nav shows ← yesterday link
- "Explore Dashboard →" link works

- [ ] **Step 5: Verify the dashboard is streamlined**

Visit `/dashboard` and confirm:
- 6 panels are visible (Story Feed, Pulse Indicators, Market Performance, Parliament, Sentiment, Labour Demand)
- 4 accordion rows are visible and collapsed by default
- Removed panels (Executive Brief, Compute, Lab Feeds, OECD, etc.) are gone
- Expanding an accordion shows the section content

- [ ] **Step 6: Verify header navigation**

Confirm header shows: Digest · Dashboard · Deep Dives · Provinces · Methodology
