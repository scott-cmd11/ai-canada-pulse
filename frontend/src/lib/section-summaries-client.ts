// frontend/src/lib/section-summaries-client.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const OPENAI_MODEL = process.env.OPENAI_BRIEF_MODEL ?? 'gpt-4o-mini'
const TIMEOUT_MS = 20_000
const TTL_SECONDS = 60 * 60 * 26 // 26h — covers timezone gaps

export type SectionKey = 'trends' | 'jobs' | 'research' | 'parliament' | 'stocks' | 'stories'
export type SectionSummaries = Record<SectionKey, string>

function redisKey(date: string) {
  return `section_summaries:${date}`
}

type Story = {
  headline: string
  summary: string
  category: string
  region: string
}

export async function generateAndSaveSectionSummaries(
  stories: Story[],
  date: string
): Promise<SectionSummaries | null> {
  if (!process.env.OPENAI_API_KEY) return null
  if (stories.length === 0) return null

  const storyContext = stories
    .slice(0, 20)
    .map((s, i) => `${i + 1}. [${s.category}/${s.region}] ${s.headline}: ${s.summary.slice(0, 120)}`)
    .join('\n')

  const prompt = `You are an analyst for AI Canada Pulse, a dashboard tracking Canadian AI developments.

Based on these ${Math.min(stories.length, 20)} recent Canadian AI news stories, write one tight sentence (max 20 words) for each domain. Be specific — mention companies, numbers, or institutions when the stories support it. If a domain has no signal, write "No notable activity this period."

Stories:
${storyContext}

Respond ONLY with valid JSON, no markdown fences:
{
  "stories": "Overall narrative of today's Canadian AI news",
  "trends": "What public search interest and attention signals show",
  "jobs": "Employment and hiring signals for Canadian AI roles",
  "research": "Academic and research activity from Canadian institutions",
  "parliament": "Policy, regulatory, or parliamentary AI activity",
  "stocks": "Market signals for publicly traded Canadian AI companies"
}`

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
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 400,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      console.error(`[section-summaries] OpenAI error ${response.status}`)
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content) as SectionSummaries
    const required: SectionKey[] = ['stories', 'trends', 'jobs', 'research', 'parliament', 'stocks']
    if (!required.every((k) => typeof parsed[k] === 'string')) return null

    await redis.set(redisKey(date), parsed, { ex: TTL_SECONDS })
    return parsed
  } catch (err) {
    console.error('[section-summaries] Generation failed:', err)
    return null
  }
}

export async function getSectionSummaries(date: string): Promise<SectionSummaries | null> {
  try {
    return await redis.get<SectionSummaries>(redisKey(date))
  } catch {
    return null
  }
}

// Returns today's summary for a key, falling back to yesterday's if today's not yet generated
export async function getSectionSummary(key: SectionKey): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]

  const summaries = (await getSectionSummaries(today)) ?? (await getSectionSummaries(yesterday))
  return summaries?.[key] ?? null
}
