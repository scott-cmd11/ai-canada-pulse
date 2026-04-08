import type { Story } from "@/lib/mock-data"
import { CANADA_DASHBOARD_STORY_LIMIT, fetchAllStories } from "@/lib/rss-client"
import { summarizeArticles, generateExecutiveBrief } from "@/lib/summarizer"
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
        headline: story.headline,
        snippet: story.summary,
        category: story.category,
        source: story.sourceName || "Unknown",
    }
}

function summaryMapToRecord(summaryMap: Map<string, string> | null): Record<string, string> {
    return summaryMap ? Object.fromEntries(summaryMap.entries()) : {}
}

// Normalize headline to a stable lookup key — guards against trailing spaces,
// curly vs straight quotes, and other invisible Unicode differences.
function headlineKey(headline: string): string {
    return headline.trim().toLowerCase().replace(/\s+/g, " ")
}

// Build a normalized index from a summaries record for fast lookup.
function buildSummaryIndex(summaries: Record<string, string>): Map<string, string> {
    const index = new Map<string, string>()
    for (const [headline, summary] of Object.entries(summaries)) {
        index.set(headlineKey(headline), summary)
    }
    return index
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
    const existingIndex = buildSummaryIndex(existingSummaries)

    // Only summarize stories that don't already have a cached summary.
    const newStories = canadaTop.filter((s) => !existingIndex.has(headlineKey(s.headline)))
    console.log(
        `[dashboard-enrichment] ${canadaTop.length} stories total; ` +
        `${canadaTop.length - newStories.length} cached, ${newStories.length} new`
    )

    const [newSummaryMap, canadaBrief] = await Promise.all([
        newStories.length > 0
            ? summarizeArticles(newStories.map(toArticleSummaryInput))
            : Promise.resolve(null),
        generateExecutiveBrief(canadaTop.map(toArticleSummaryInput)),
    ])

    // Merge: existing summaries + newly generated ones.
    // Use the canonical headline (from the current story list) as the key so
    // the hydration lookup is consistent.
    const mergedSummaries: Record<string, string> = {}
    for (const story of canadaTop) {
        const key = story.headline
        const normalizedKey = headlineKey(key)
        const cached = existingIndex.get(normalizedKey)
        const fresh = newSummaryMap?.get(key)
        const summary = fresh ?? cached
        if (summary) mergedSummaries[key] = summary
    }

    const generatedAt = new Date().toISOString()
    const bundle = {
        canada: {
            summaries: mergedSummaries,
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

    const enrichedStories = stories.map((story) => ({
        ...story,
        aiSummary: summaryIndex.get(headlineKey(story.headline)) ?? story.aiSummary,
    }))

    return {
        stories: enrichedStories,
        executiveBrief: payload.executiveBrief,
        generatedAt: payload.generatedAt,
    }
}

export async function readCachedDashboardEnrichment(kind: DashboardEnrichmentKind): Promise<DashboardEnrichmentPayload | null> {
    return readDashboardEnrichment(kind)
}
