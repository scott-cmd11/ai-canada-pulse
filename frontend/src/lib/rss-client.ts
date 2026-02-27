import Parser from "rss-parser"
import type { Story, Category, PulseData } from "./mock-data"

// ─── Feed registry ──────────────────────────────────────────────────────────

interface FeedConfig {
  url: string
  name: string
  /** If true, every item from this feed is AI-related (pre-filtered by query) */
  aiOnly: boolean
}

const FEED_REGISTRY: FeedConfig[] = [
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
  { pattern: /\b(Toronto|Ontario|Waterloo|Kitchener)\b/i, region: "Ontario" },
  { pattern: /\b(Montreal|Montr[eé]al|Quebec|Mila|Laval)\b/i, region: "Quebec" },
  { pattern: /\b(Vancouver|British Columbia|B\.?C\.)\b/i, region: "British Columbia" },
  { pattern: /\b(Alberta|Edmonton|Calgary)\b/i, region: "Alberta" },
  { pattern: /\b(federal|Canada|national|government|Ottawa|parliament|minister)\b/i, region: "Federal" },
]

function detectRegion(title: string, description: string): string {
  const text = `${title} ${description}`
  for (const rule of REGION_RULES) {
    if (rule.pattern.test(text)) return rule.region
  }
  return "Canada"
}

// ─── Caching ────────────────────────────────────────────────────────────────

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

interface CacheEntry {
  stories: Story[]
  fetchedAt: number
}

let storyCache: CacheEntry | null = null

// ─── RSS parser instance ────────────────────────────────────────────────────

const parser = new Parser({
  timeout: 10000,
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
        if (config.aiOnly) return true
        return isAIRelated(t, d)
      })
      .map((item, index) => {
        const title = item.title || "Untitled"
        const description = item.contentSnippet || item.content || ""
        const cleanSummary = description.replace(/<[^>]*>/g, "").trim().slice(0, 300)

        return {
          id: `rss-${Buffer.from(item.link || item.guid || `${config.name}-${index}`).toString("base64url").slice(0, 16)}`,
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

export async function fetchAllStories(): Promise<Story[]> {
  // Check cache
  if (storyCache && Date.now() - storyCache.fetchedAt < CACHE_TTL) {
    return storyCache.stories
  }

  const feedResults = await Promise.allSettled(
    FEED_REGISTRY.map((config) => fetchSingleFeed(config))
  )

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

  // Limit to 20 most recent stories
  allStories = allStories.slice(0, 20)

  // Mark the most recent story as the briefing top
  if (allStories.length > 0) {
    allStories[0].isBriefingTop = true
  }

  // Cache and return if we got results
  if (allStories.length > 0) {
    storyCache = { stories: allStories, fetchedAt: Date.now() }
    return allStories
  }

  // All feeds failed — return empty (no mock data)
  return []
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
