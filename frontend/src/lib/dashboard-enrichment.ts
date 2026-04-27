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

// Build a lookup index keyed by story id (the raw key stored in the bundle).
function buildSummaryIndex(summaries: Record<string, string>): Map<string, string> {
    return new Map(Object.entries(summaries))
}

// Same pattern as summaries, keyed by story id.
function buildTopicsIndex(topics: Record<string, string[]>): Map<string, string[]> {
    return new Map(Object.entries(topics))
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
    const newStories = canadaTop.filter((s) => !existingSummaryIndex.has(s.id))
    // Only tag stories whose topics haven't been computed yet.
    const storiesNeedingTopics = canadaTop.filter(
        (s) => !existingTopicsIndex.has(s.id),
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
        const cachedSummary = existingSummaryIndex.get(story.id)
        const freshSummary = newSummaryMap?.get(story.id)
        const summary = freshSummary ?? cachedSummary
        if (summary) mergedSummaries[story.id] = summary

        const cachedTags = existingTopicsIndex.get(story.id)
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
        const cachedTopics = topicsIndex.get(story.id)
        return {
            ...story,
            aiSummary: summaryIndex.get(story.id) ?? story.aiSummary,
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
