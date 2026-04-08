// frontend/src/lib/weekly-digest.ts
// Compiles the last 7 days of daily digests into a weekly summary for email.

import { getDigest } from './digest-client'
import type { WeeklyEmailData } from './email'

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

  // Compile all developments from the week
  const allDevelopments = validDigests.flatMap(d =>
    d.developments.map(dev => `[${d.date}] ${dev.text}`)
  )
  const allHeadlines = validDigests.map(d => d.headline)

  // Use OpenAI to synthesize a weekly summary
  if (!OPENAI_API_KEY) {
    // Fallback without AI
    return {
      headline: `${validDigests.length} days of Canadian AI developments`,
      intro: `Here's what happened in Canadian AI this week across ${allDevelopments.length} developments.`,
      developments: allDevelopments.slice(0, 7),
      weekRange,
    }
  }

  const systemPrompt = `You are a concise intelligence analyst writing a weekly AI briefing for Canada.

Given daily digest headlines and developments from the past week, produce:
1. A headline (8-14 words) capturing the week's dominant theme
2. An intro paragraph (2-3 sentences, 40-60 words) summarizing the week's most important patterns
3. A list of 5-7 key developments (each 1 sentence, 15-25 words) ordered by significance

Output ONLY a JSON object with keys: headline, intro, developments (array of strings).
Do not mention feed metadata or categories. Use concrete, direct language.`

  const userPrompt = `Weekly digest data (${validDigests.length} days):

Daily headlines: ${allHeadlines.join(' | ')}

All developments:
${allDevelopments.join('\n')}

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
        max_completion_tokens: 600,
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

    return {
      headline: parsed.headline || `This week in Canadian AI`,
      intro: parsed.intro || '',
      developments: Array.isArray(parsed.developments) ? parsed.developments : [],
      weekRange,
    }
  } catch (err) {
    console.error('[weekly-digest] Error:', err)
    return null
  }
}
