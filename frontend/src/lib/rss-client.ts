// RSS feed aggregator for Canadian AI news
// Sources: Google News RSS (AI Canada search), BetaKit (betakit.com/feed/), CBC Technology (cbc.ca/webfeed/rss/rss-technology)
// No API key required; filters AI-relevant items via keyword regex

import Parser from "rss-parser"
import { unstable_cache } from "next/cache"
import type { Story, Category, PulseData } from "./mock-data"

// ─── Feed registry ──────────────────────────────────────────────────────────

interface FeedConfig {
  url: string
  name: string
  /** If true, every item from this feed is AI-related (pre-filtered by query) */
  aiOnly: boolean
}

export const CANADA_DASHBOARD_STORY_LIMIT = 50

// Internal limit before province filtering — larger pool so smaller provinces get stories
const INTERNAL_STORY_LIMIT = 50

const FEED_REGISTRY: FeedConfig[] = [
  // ── National feeds ──
  {
    url: "https://news.google.com/rss/search?q=artificial+intelligence+Canada&hl=en-CA&gl=CA&ceid=CA:en",
    name: "Google News",
    aiOnly: true,
  },
  {
    url: "https://betakit.com/feed/",
    name: "BetaKit",
    aiOnly: false,
  },
  {
    url: "https://www.cbc.ca/webfeed/rss/rss-technology",
    name: "CBC Technology",
    aiOnly: false,
  },
  // ── Province-targeted feeds — surfaces stories the national query misses ──
  {
    url: "https://news.google.com/rss/search?q=AI+Manitoba+OR+Winnipeg+artificial+intelligence&hl=en-CA&gl=CA&ceid=CA:en",
    name: "Google News",
    aiOnly: true,
  },
  {
    url: "https://news.google.com/rss/search?q=AI+Saskatchewan+OR+Regina+OR+Saskatoon+artificial+intelligence&hl=en-CA&gl=CA&ceid=CA:en",
    name: "Google News",
    aiOnly: true,
  },
  {
    url: "https://news.google.com/rss/search?q=AI+%22Nova+Scotia%22+OR+Halifax+artificial+intelligence&hl=en-CA&gl=CA&ceid=CA:en",
    name: "Google News",
    aiOnly: true,
  },
  {
    url: "https://news.google.com/rss/search?q=AI+%22New+Brunswick%22+OR+Fredericton+OR+Moncton+artificial+intelligence&hl=en-CA&gl=CA&ceid=CA:en",
    name: "Google News",
    aiOnly: true,
  },
  {
    url: "https://news.google.com/rss/search?q=AI+Newfoundland+OR+Labrador+OR+%22St+Johns%22+artificial+intelligence&hl=en-CA&gl=CA&ceid=CA:en",
    name: "Google News",
    aiOnly: true,
  },
  {
    url: "https://news.google.com/rss/search?q=AI+%22Prince+Edward+Island%22+OR+PEI+OR+Charlottetown+artificial+intelligence&hl=en-CA&gl=CA&ceid=CA:en",
    name: "Google News",
    aiOnly: true,
  },
  {
    url: "https://news.google.com/rss/search?q=AI+Alberta+OR+Edmonton+OR+Calgary+artificial+intelligence+Amii&hl=en-CA&gl=CA&ceid=CA:en",
    name: "Google News",
    aiOnly: true,
  },
  {
    url: "https://news.google.com/rss/search?q=AI+%22British+Columbia%22+OR+Vancouver+OR+Victoria+artificial+intelligence&hl=en-CA&gl=CA&ceid=CA:en",
    name: "Google News",
    aiOnly: true,
  },
]

// ─── AI relevance filter ────────────────────────────────────────────────────

const AI_KEYWORDS =
  /\b(artificial intelligence|(?<!\w)AI(?!\w)|machine learning|deep learning|neural network|large language model|LLM|generative AI|ChatGPT|OpenAI|GPT|Mila|Vector Institute|CIFAR|Cohere|AI safety|AI regulation|compute|AGI|diffusion model|transformer|NLP|natural language processing|computer vision|robotics|autonomous|AI governance|AI ethics|Anthropic|DeepMind|frontier model|Tenstorrent|AI chip|AI startup|AI funding)\b/i

function isAIRelated(title: string, description: string): boolean {
  return AI_KEYWORDS.test(title) || AI_KEYWORDS.test(description)
}

// ─── Finance / crypto exclusion filter ──────────────────────────────────────

const EXCLUSION_KEYWORDS =
  /\b(stocks?|TSX|NASDAQ|NYSE|ETF|dividends?|portfolio|investors?|buy(?:ing)?|sell(?:ing)?|rally|bull(?:ish)?|bear(?:ish)?|market\s*cap|share\s*price|earnings|valuation|crypto(?:currency)?|bitcoin|ethereum|blockchain|tokens?|NFT|DeFi|Web3)\b|(?:I[''\u2019]d\s+buy|top\s+picks|best\s+stocks|investment\s+opportunit)/i

function isFinanceNoise(title: string, description: string): boolean {
  return EXCLUSION_KEYWORDS.test(title) || EXCLUSION_KEYWORDS.test(description)
}

// ─── Non-Canadian geography disambiguation ───────────────────────────────────
// Catches articles that mention Canadian place names but are clearly set in the US or abroad.
// E.g. "New Brunswick, NJ", "Ontario, California", "London, UK"

const NON_CANADA_GEO =
  /\bNew Brunswick\s*,?\s*(NJ|New Jersey)\b|\bOntario\s*,?\s*(CA|California|Ohio|OH)\b|\bLondon\s*,?\s*(UK|England|United Kingdom)\b|\bVictoria\s*,?\s*(TX|Texas|Australia|AUS)\b|\bWindsor\s*,?\s*(CT|Connecticut)\b|\bCambridge\s*,?\s*(MA|Massachusetts|England|UK)\b/i

function isNonCanadianGeo(title: string, description: string): boolean {
  const text = `${title} ${description}`
  return NON_CANADA_GEO.test(text)
}

// ─── Sentiment classification ───────────────────────────────────────────────

const POSITIVE_KEYWORDS =
  /\b(funding|funded|investment|invest|partnership|partner|launch|launches|launched|breakthrough|growth|growing|hire|hiring|expand|expanding|billion|million|innovation|innovative|advance|advancing|milestone|award|awarded|succeed|success|promising|opportunity|record|boost|lead|leading)\b/i

const NEGATIVE_KEYWORDS =
  /\b(layoff|laid off|cut|cuts|cutting|risk|risks|concern|concerns|ban|banned|restrict|restriction|threat|threatens|decline|declining|struggle|struggling|warning|warns|investigation|shutdown|shutting|lawsuit|sued|bias|biased|harm|harmful|replace|replacing|job loss|danger|dangerous|scrutiny|backlash|controversy|fraud|misinformation|deepfake)\b/i

function classifySentiment(title: string, description: string): "positive" | "neutral" | "concerning" {
  const text = `${title} ${description}`
  const posMatches = text.match(POSITIVE_KEYWORDS)
  const negMatches = text.match(NEGATIVE_KEYWORDS)
  const posCount = posMatches ? posMatches.length : 0
  const negCount = negMatches ? negMatches.length : 0

  if (posCount > negCount) return "positive"
  if (negCount > posCount) return "concerning"
  return "neutral"
}

// ─── Category assignment ────────────────────────────────────────────────────

const CATEGORY_RULES: { pattern: RegExp; category: Category }[] = [
  {
    pattern:
      /\b(policy|regulation|government|bill|legislation|framework|minister|parliament|senate|regulatory|compliance|governance|act|law|safety framework|audit|oversight)\b/i,
    category: "Policy & Regulation",
  },
  {
    pattern:
      /\b(research|paper|study|university|professor|lab|breakthrough|publication|peer.reviewed|conference|arxiv|journal|PhD|Mila|Vector Institute|CIFAR|Amii)\b/i,
    category: "Research",
  },
  {
    pattern:
      /\b(talent|education|student|graduate|hiring|workforce|training|upskill|brain drain|enrolment|curriculum|bootcamp|co.op|intern)\b/i,
    category: "Talent & Education",
  },
  {
    pattern:
      /\b(global|international|race|compete|ranking|index|china|US|europe|UK|geopolitics|summit|G7|NATO|bilateral|treaty|cooperation)\b/i,
    category: "Global AI Race",
  },
]

function assignCategory(title: string, description: string): Category {
  const text = `${title} ${description}`
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category
  }
  return "Industry & Startups"
}

// ─── Region detection ───────────────────────────────────────────────────────

const REGION_RULES: { pattern: RegExp; region: string }[] = [
  // Provinces — ordered large to small so more-specific matches win first
  { pattern: /\b(Toronto|Ontario|Waterloo|Kitchener|Hamilton|Windsor)\b/i,                        region: "Ontario" },
  { pattern: /\b(Montreal|Montr[eé]al|Qu[eé]bec|Mila|Laval|Sherbrooke|Gatineau)\b/i,            region: "Quebec" },
  { pattern: /\b(Vancouver|Victoria|British Columbia|B\.?C\.|Surrey|Burnaby|Kelowna)\b/i,         region: "British Columbia" },
  { pattern: /\b(Alberta|Edmonton|Calgary|Red Deer|Lethbridge|Amii)\b/i,                          region: "Alberta" },
  { pattern: /\b(Saskatchewan|Regina|Saskatoon)\b/i,                                              region: "Saskatchewan" },
  { pattern: /\b(Manitoba|Winnipeg|Brandon)\b/i,                                                  region: "Manitoba" },
  { pattern: /\b(Nova Scotia|Halifax|Cape Breton|Dalhousie)\b/i,                                  region: "Nova Scotia" },
  { pattern: /\b(New Brunswick|Fredericton|Moncton|Saint John)\b/i,                               region: "New Brunswick" },
  { pattern: /\b(Newfoundland|Labrador|St\.?\s*John[''s]*|Memorial University)\b/i,               region: "Newfoundland & Labrador" },
  { pattern: /\b(Prince Edward Island|P\.?E\.?I\.?|Charlottetown|UPEI)\b/i,                      region: "Prince Edward Island" },
  // Territories
  { pattern: /\b(Yukon|Whitehorse)\b/i,                                                           region: "Yukon" },
  { pattern: /\b(Northwest Territories|N\.?W\.?T\.?|Yellowknife)\b/i,                            region: "Northwest Territories" },
  { pattern: /\b(Nunavut|Iqaluit)\b/i,                                                            region: "Nunavut" },
  // Federal — broad terms that don't imply a specific province
  { pattern: /\b(federal|national|government|Ottawa|parliament|minister|ISED|NRC|CIFAR)\b/i,      region: "Federal" },
]

function detectRegion(title: string, description: string): string {
  const text = `${title} ${description}`
  for (const rule of REGION_RULES) {
    if (rule.pattern.test(text)) return rule.region
  }
  return "Canada"
}

// ─── RSS parser instance ────────────────────────────────────────────────────

const parser = new Parser({
  timeout: 5000,
  headers: { "User-Agent": "AICanadaPulse/1.0 (news aggregator)" },
})

// ─── Fetch a single feed ────────────────────────────────────────────────────

async function fetchSingleFeed(config: FeedConfig): Promise<Story[]> {
  try {
    const feed = await parser.parseURL(config.url)

    return (feed.items || [])
      .filter((item) => {
        const t = item.title || ""
        const d = item.contentSnippet || item.content || ""
        // Exclude finance/crypto noise FIRST (applies to ALL feeds, including aiOnly)
        if (isFinanceNoise(t, d)) return false
        // Reject articles that use Canadian place names in a clearly non-Canadian context
        if (isNonCanadianGeo(t, d)) return false
        if (config.aiOnly) return true
        return isAIRelated(t, d)
      })
      .map((item, index) => {
        const title = item.title || "Untitled"
        const description = item.contentSnippet || item.content || ""
        const cleanSummary = description.replace(/<[^>]*>/g, "").trim().slice(0, 300)

        return {
          id: `rss-${Buffer.from(item.link || item.guid || `${config.name}-${index}`).toString("base64url").slice(-24)}`,
          headline: title.replace(/ - [^-]+$/, "").trim(),
          summary: cleanSummary || "No summary available.",
          category: assignCategory(title, cleanSummary),
          region: detectRegion(title, cleanSummary),
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          sentiment: classifySentiment(title, cleanSummary),
          isBriefingTop: false,
          sourceUrl: item.link || "",
          sourceName: config.name,
        }
      })
  } catch (err) {
    console.warn(`[rss-client] Failed to fetch feed: ${config.name}`, err)
    return []
  }
}

// ─── Public: fetch all stories with cache + fallback ────────────────────────

async function _fetchAllStories(): Promise<Story[]> {
  // Hard cap: never wait more than 6s total, even if individual feeds hit their 5s timeout
  const timeout = new Promise<PromiseSettledResult<Story[]>[]>((resolve) =>
    setTimeout(() => resolve(FEED_REGISTRY.map(() => ({ status: "fulfilled" as const, value: [] }))), 6000)
  )
  const feedResults = await Promise.race([
    Promise.allSettled(FEED_REGISTRY.map((config) => fetchSingleFeed(config))),
    timeout,
  ])

  let allStories = feedResults
    .filter((r): r is PromiseFulfilledResult<Story[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)

  // Deduplicate by normalized headline
  const seen = new Set<string>()
  allStories = allStories.filter((s) => {
    const key = s.headline.toLowerCase().replace(/[^a-z0-9]/g, "")
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort by publishedAt descending (most recent first)
  allStories.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  // Keep a larger pool internally so province filtering has enough to work with.
  // The dashboard UI applies its own CANADA_DASHBOARD_STORY_LIMIT display cap.
  allStories = allStories.slice(0, INTERNAL_STORY_LIMIT)

  // Mark the most recent story as the briefing top
  if (allStories.length > 0) {
    allStories[0].isBriefingTop = true
  }

  return allStories
}

export const fetchAllStories = unstable_cache(
  _fetchAllStories,
  ["rss-stories-canada-ai"],
  { revalidate: 3600 } // 60 minutes
)

// ─── Public: filter stories by region display name ──────────────────────────

export function filterStoriesByRegion(stories: Story[], regionName: string): Story[] {
  const target = regionName.toLowerCase();
  return stories.filter(s => s.region.toLowerCase() === target);
}

// ─── Public: derive PulseScore from story sentiment distribution ────────────

export function derivePulseFromStories(stories: Story[]): PulseData {
  if (stories.length === 0) {
    return {
      mood: "amber",
      moodLabel: "Awaiting data",
      description: "No recent stories available to assess the AI landscape.",
      updatedAt: new Date().toISOString(),
    }
  }

  const counts = { positive: 0, neutral: 0, concerning: 0 }
  for (const s of stories) {
    counts[s.sentiment]++
  }

  const total = stories.length
  const positiveRatio = counts.positive / total
  const concerningRatio = counts.concerning / total

  let mood: "green" | "amber" | "red"
  let moodLabel: string

  if (positiveRatio >= 0.5) {
    mood = "green"
    moodLabel = "Positive"
  } else if (concerningRatio >= 0.4) {
    mood = "red"
    moodLabel = "Negative"
  } else {
    mood = "amber"
    moodLabel = "Neutral"
  }

  // Build a summary from the category distribution
  const categoryCounts = new Map<string, number>()
  for (const s of stories.slice(0, 10)) {
    categoryCounts.set(s.category, (categoryCounts.get(s.category) || 0) + 1)
  }
  const topCategory =
    Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "AI"

  const description = `Based on ${total} recent stories, Canada's AI landscape is currently driven by ${topCategory.toLowerCase()} news. Most coverage is neutral in tone, with ${counts.positive} positive and ${counts.concerning} concerning signals.`

  return {
    mood,
    moodLabel,
    description,
    updatedAt: new Date().toISOString(),
  }
}
