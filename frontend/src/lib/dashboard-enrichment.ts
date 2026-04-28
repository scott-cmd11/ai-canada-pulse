import type { Story } from "@/lib/mock-data"
import { CANADA_DASHBOARD_STORY_LIMIT, fetchAllStories } from "@/lib/rss-client"
import { summarizeArticles, generateExecutiveBrief } from "@/lib/summarizer"
import { tagStoryTopics } from "@/lib/topic-tagger"
import {
    readDashboardEnrichment,
    readDashboardEnrichmentBundle,
    writeDashboardEnrichmentBundle,
    type DashboardEnrichmentKind,
    type DashboardEnrichmentPayload,
} from "@/lib/ai-enrichment-cache"

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(raw ?? `${fallback}`, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback
    return parsed
}

function getCanadaSummaryTopN(totalStories: number): number {
    const configured = parsePositiveInt(
        process.env.AI_CANADA_SUMMARY_TOP_N,
        CANADA_DASHBOARD_STORY_LIMIT
    )
    return Math.min(totalStories, configured, CANADA_DASHBOARD_STORY_LIMIT)
}

function toArticleSummaryInput(story: Story) {
    return {
        id: story.id,
        headline: story.headline,
        snippet: story.summary,
        category: story.category,
        source: story.sourceName || "Unknown",
    }
}

function summaryMapToRecord(summaryMap: Map<string, string> | null): Record<string, string> {
    return summaryMap ? Object.fromEntries(summaryMap.entries()) : {}
}

// Normalize a headline for legacy (v2) bundle lookups.
function normalizeHeadline(headline: string): string {
    return headline.trim().toLowerCase().replace(/\s+/g, " ")
}

// Build a lookup index keyed by raw bundle key (story id for new entries, original
// headline for legacy v2 entries). Also adds a normalized-headline entry for each
// key so the dual-key lookup in hydrateCanadaStories works against old bundles.
function buildSummaryIndex(summaries: Record<string, string>): Map<string, string> {
    const index = new Map<string, string>()
    for (const [key, summary] of Object.entries(summaries)) {
        index.set(key, summary)
        const norm = normalizeHeadline(key)
        if (norm !== key) index.set(norm, summary)
    }
    return index
}

// Same dual-key pattern for topics.
function buildTopicsIndex(topics: Record<string, string[]>): Map<string, string[]> {
    const index = new Map<string, string[]>()
    for (const [key, tags] of Object.entries(topics)) {
        index.set(key, tags)
        const norm = normalizeHeadline(key)
        if (norm !== key) index.set(norm, tags)
    }
    return index
}

// Check if a story already has a cached entry — try id first, then headline fallback
// for legacy bundles keyed by headline.
function isCachedSummary(story: Story, index: Map<string, string>): boolean {
    return index.has(story.id) || index.has(normalizeHeadline(story.headline))
}

function isCachedTopics(story: Story, index: Map<string, string[]>): boolean {
    return index.has(story.id) || index.has(normalizeHeadline(story.headline))
}

export async function refreshDashboardEnrichmentBundle() {
    const canadaStories = await fetchAllStories()
    const canadaLimit = getCanadaSummaryTopN(canadaStories.length)
    const canadaTop = canadaStories.slice(0, canadaLimit)

    // ── Incremental enrichment ──────────────────────────────────────────────
    // Read existing summaries so we can carry them forward instead of
    // re-summarizing every story from scratch on each cron run.
    const existingBundle = await readDashboardEnrichmentBundle()
    const existingSummaries: Record<string, string> = existingBundle?.canada?.summaries ?? {}
    const existingTopics: Record<string, string[]> = existingBundle?.canada?.topics ?? {}
    const existingSummaryIndex = buildSummaryIndex(existingSummaries)
    const existingTopicsIndex = buildTopicsIndex(existingTopics)

    // Only summarize stories that don't already have a cached summary.
    // Checks id first, then headline fallback for legacy v2 bundles.
    const newStories = canadaTop.filter((s) => !isCachedSummary(s, existingSummaryIndex))
    // Only tag stories whose topics haven't been computed yet.
    const storiesNeedingTopics = canadaTop.filter(
        (s) => !isCachedTopics(s, existingTopicsIndex),
    )
    console.log(
        `[dashboard-enrichment] ${canadaTop.length} stories total; ` +
        `${canadaTop.length - newStories.length} cached summaries, ${newStories.length} new; ` +
        `${storiesNeedingTopics.length} need topics`,
    )

    const [newSummaryMap, canadaBrief, newTopicsMap] = await Promise.all([
        newStories.length > 0
            ? summarizeArticles(newStories.map(toArticleSummaryInput))
            : Promise.resolve(null),
        generateExecutiveBrief(canadaTop.map(toArticleSummaryInput)),
        storiesNeedingTopics.length > 0
            ? tagStoryTopics(
                storiesNeedingTopics.map((s) => ({
                    id: s.id,
                    headline: s.headline,
                    snippet: s.summary,
                    category: s.category,
                })),
            )
            : Promise.resolve(new Map<string, string[]>()),
    ])

    // Merge: existing summaries + newly generated ones.
    // Use the canonical headline (from the current story list) as the key so
    // the hydration lookup is consistent.
    const mergedSummaries: Record<string, string> = {}
    const mergedTopics: Record<string, string[]> = {}
    for (const story of canadaTop) {
        // id-first lookup, then headline fallback for legacy v2 entries
        const normalizedHeadline = normalizeHeadline(story.headline)
        const cachedSummary = existingSummaryIndex.get(story.id) ?? existingSummaryIndex.get(normalizedHeadline)
        const freshSummary = newSummaryMap?.get(story.id)
        const summary = freshSummary ?? cachedSummary
        if (summary) mergedSummaries[story.id] = summary

        const cachedTags = existingTopicsIndex.get(story.id) ?? existingTopicsIndex.get(normalizedHeadline)
        const freshTags = newTopicsMap.get(story.id)
        const tags = freshTags ?? cachedTags
        if (tags && tags.length > 0) mergedTopics[story.id] = tags
    }

    const generatedAt = new Date().toISOString()
    const bundle = {
        canada: {
            summaries: mergedSummaries,
            topics: mergedTopics,
            executiveBrief: canadaBrief,
            generatedAt,
        },
        generatedAt,
    }

    await writeDashboardEnrichmentBundle(bundle)
    return {
        ...bundle,
        counts: {
            canadaVisibleStories: canadaStories.length,
            canadaSummaryTarget: canadaTop.length,
            newlySummarized: newStories.length,
            carriedForward: canadaTop.length - newStories.length,
            newlyTagged: storiesNeedingTopics.length,
        },
    }
}

export async function hydrateCanadaStories(stories: Story[]) {
    const payload = await readDashboardEnrichment("canada")
    if (!payload) {
        return { stories, executiveBrief: null as string[] | null, generatedAt: null as string | null }
    }

    // Build a normalized lookup index so minor headline differences don't cause misses.
    const summaryIndex = buildSummaryIndex(payload.summaries)
    const topicsIndex = buildTopicsIndex(payload.topics ?? {})

    const enrichedStories = stories.map((story) => {
        const normalizedHeadline = normalizeHeadline(story.headline)
        const aiSummary = summaryIndex.get(story.id)
            ?? summaryIndex.get(normalizedHeadline)
            ?? story.aiSummary
        const cachedTopics = topicsIndex.get(story.id) ?? topicsIndex.get(normalizedHeadline)
        return {
            ...story,
            aiSummary,
            topics: cachedTopics && cachedTopics.length > 0 ? cachedTopics : story.topics,
        }
    })

    return {
        stories: enrichedStories,
        executiveBrief: payload.executiveBrief,
        generatedAt: payload.generatedAt,
    }
}

export async function readCachedDashboardEnrichment(kind: DashboardEnrichmentKind): Promise<DashboardEnrichmentPayload | null> {
    return readDashboardEnrichment(kind)
}
