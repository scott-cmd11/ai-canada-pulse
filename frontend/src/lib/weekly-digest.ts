// frontend/src/lib/weekly-digest.ts
// Compiles the last 7 days of daily digests into a weekly summary for email.

import { getDigest } from './digest-client'
import type { WeeklyEmailData, WeeklyTopStory } from './email'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ''
const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = process.env.OPENAI_BRIEF_MODEL ?? 'gpt-4o-mini'
const TIMEOUT_MS = 25_000

export async function compileWeeklyDigest(): Promise<WeeklyEmailData | null> {
  // Collect the last 7 days of digests
  const today = new Date()
  const dates: string[] = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }

  const digests = await Promise.all(
    dates.map(async (date) => {
      try {
        return await getDigest(date)
      } catch {
        return null
      }
    })
  )

  const validDigests = digests.filter(
    (d): d is NonNullable<typeof d> => d !== null && !d.error
  )

  if (validDigests.length === 0) {
    console.warn('[weekly-digest] No valid digests found for the past 7 days')
    return null
  }

  // Build the week range string
  const oldestDate = new Date(dates[dates.length - 1] + 'T12:00:00Z')
  const newestDate = new Date(dates[0] + 'T12:00:00Z')
  const weekRange = `${oldestDate.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', timeZone: 'UTC' })} – ${newestDate.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`

  // Compile all developments and headlines from the week
  const allDevelopments = validDigests.flatMap(d =>
    d.developments.map(dev => `[${d.date}] [${dev.tag}] ${dev.text}`)
  )
  const allHeadlines = validDigests.map(d => `[${d.date}] ${d.headline}`)

  // Collect top stories from across the week (fuzzy deduped, max 5)
  const topStoryCandidates: WeeklyTopStory[] = []

  const STOPWORDS = new Set(['the','a','an','and','or','of','to','in','on','for','with','from','by','as','at','is','are','was','its','how','can','may','will','could','should','says','said','new','what','why','who','being','used','add','say'])

  function extractKeywords(headline: string): Set<string> {
    return new Set(
      headline.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
        .filter(w => w.length >= 3 && !STOPWORDS.has(w))
    )
  }

  function extractBigrams(headline: string): Set<string> {
    const words = headline.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
      .filter(w => w.length >= 3 && !STOPWORDS.has(w))
    const bigrams = new Set<string>()
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.add(`${words[i]} ${words[i + 1]}`)
    }
    return bigrams
  }

  function isDuplicateStory(headline: string, existing: WeeklyTopStory[]): boolean {
    const keywords = extractKeywords(headline)
    if (keywords.size === 0) return false
    const bigrams = extractBigrams(headline)

    for (const story of existing) {
      const existingKw = extractKeywords(story.headline)
      if (existingKw.size === 0) continue

      // Layer 1: Bigram match — any shared two-word phrase is a strong duplicate signal
      const existingBigrams = extractBigrams(story.headline)
      let bigramOverlap = false
      Array.from(bigrams).forEach(b => { if (existingBigrams.has(b)) bigramOverlap = true })
      if (bigramOverlap) return true

      // Layer 2: Keyword overlap (50% of the smaller set)
      let overlap = 0
      Array.from(keywords).forEach(w => { if (existingKw.has(w)) overlap++ })
      const similarity = overlap / Math.min(keywords.size, existingKw.size)
      if (similarity >= 0.5) return true
    }
    return false
  }

  for (const digest of validDigests) {
    for (const story of digest.topStories) {
      if (!isDuplicateStory(story.headline, topStoryCandidates)) {
        topStoryCandidates.push({
          headline: story.headline,
          summary: '',
          url: story.url,
          source: story.source,
        })
      }
    }
  }
  const topStoryPool = topStoryCandidates.slice(0, 5)

  // Use OpenAI to synthesize the weekly summary + story summaries
  if (!OPENAI_API_KEY) {
    return {
      headline: `${validDigests.length} days of Canadian AI developments`,
      intro: `Here's what happened in Canadian AI this week across ${allDevelopments.length} developments.`,
      dominantTheme: 'Multiple themes across the week',
      developments: allDevelopments.slice(0, 7).map(d => d.replace(/^\[.*?\]\s*\[.*?\]\s*/, '')),
      topStories: topStoryPool,
      weekRange,
    }
  }

  // Compile the top story headlines for context
  const topStoryContext = topStoryPool.length > 0
    ? `\n\nTop stories from the week:\n${topStoryPool.map((s, i) => `${i + 1}. "${s.headline}" (${s.source})`).join('\n')}`
    : ''

  const systemPrompt = `You are a concise intelligence analyst writing a weekly AI briefing for Canada.

Given daily digest headlines, tagged developments, and top stories from the past week, produce:
1. headline: (8-14 words) A headline capturing the week's most consequential shift or development
2. intro: (2-3 sentences, 40-60 words) What happened this week and why it matters
3. dominantTheme: (1 sentence, 10-20 words) Name the dominant theme and briefly explain why it emerged — e.g. "Regulatory momentum as three provinces introduced AI governance frameworks"
4. developments: (5-7 items, each 1 sentence, 15-25 words) The most significant developments ordered by impact, drawn from the tagged developments provided
5. storySummaries: (array of strings) For each top story headline provided, write a 2-3 sentence summary (40-60 words) explaining what happened, who is involved, and why it matters for Canadian AI. Output exactly ${topStoryPool.length} summaries in the same order as the top stories.

Output ONLY a JSON object with keys: headline, intro, dominantTheme, developments (array of strings), storySummaries (array of strings).
Use concrete, specific language. No filler. Use Canadian English spelling (e.g. "centre" not "center", "colour" not "color", "labour" not "labor", "defence" not "defense").`

  const userPrompt = `Weekly digest data (${validDigests.length} days):

Daily headlines:
${allHeadlines.join('\n')}

All developments (tagged by category):
${allDevelopments.join('\n')}
${topStoryContext}

Synthesize into a weekly summary.`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(OPENAI_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
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

    if (!res.ok) {
      console.warn(`[weekly-digest] OpenAI API error ${res.status}`)
      return null
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) return null

    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) return null

    const parsed = JSON.parse(cleaned.slice(start, end + 1))

    // Merge AI-generated summaries into the top stories
    const storySummaries: string[] = Array.isArray(parsed.storySummaries) ? parsed.storySummaries : []
    const enrichedTopStories = topStoryPool.map((story, i) => ({
      ...story,
      summary: storySummaries[i] || '',
    }))

    return {
      headline: parsed.headline || 'This week in Canadian AI',
      intro: parsed.intro || '',
      dominantTheme: parsed.dominantTheme || '',
      developments: Array.isArray(parsed.developments) ? parsed.developments : [],
      topStories: enrichedTopStories,
      weekRange,
    }
  } catch (err) {
    console.error('[weekly-digest] Error:', err)
    return null
  }
}
