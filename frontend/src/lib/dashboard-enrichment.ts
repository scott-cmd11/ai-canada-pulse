import type { Story } from "@/lib/mock-data"
import type { GlobalStory } from "@/lib/global-client"
import { CANADA_DASHBOARD_STORY_LIMIT, fetchAllStories } from "@/lib/rss-client"
import { fetchGlobalAINews } from "@/lib/global-client"
import { summarizeArticles, summarizeGlobalArticles, generateExecutiveBrief, generateGlobalBrief } from "@/lib/summarizer"
import {
    readDashboardEnrichment,
    writeDashboardEnrichmentBundle,
    type DashboardEnrichmentKind,
    type DashboardEnrichmentPayload,
} from "@/lib/ai-enrichment-cache"

const DEFAULT_GLOBAL_SUMMARY_TOP_N = 10

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

function getGlobalSummaryTopN(totalStories: number): number {
    const configured = parsePositiveInt(process.env.AI_SUMMARY_TOP_N, DEFAULT_GLOBAL_SUMMARY_TOP_N)
    return Math.min(totalStories, configured)
}

function toArticleSummaryInput(story: Story) {
    return {
        headline: story.headline,
        snippet: story.summary,
        category: story.category,
        source: story.sourceName || "Unknown",
    }
}

function toGlobalArticleSummaryInput(story: GlobalStory) {
    return {
        headline: story.headline,
        snippet: story.summary,
        category: story.region,
        source: story.sourceName || "Unknown",
    }
}

function summaryMapToRecord(summaryMap: Map<string, string> | null): Record<string, string> {
    return summaryMap ? Object.fromEntries(summaryMap.entries()) : {}
}

export async function refreshDashboardEnrichmentBundle() {
    const [canadaStories, globalStories] = await Promise.all([
        fetchAllStories(),
        fetchGlobalAINews(),
    ])

    const canadaLimit = getCanadaSummaryTopN(canadaStories.length)
    const globalLimit = getGlobalSummaryTopN(globalStories.length)
    const canadaTop = canadaStories.slice(0, canadaLimit)
    const globalTop = globalStories.slice(0, globalLimit)

    const [canadaSummaryMap, canadaBrief, globalSummaryMap, globalBrief] = await Promise.all([
        summarizeArticles(canadaTop.map(toArticleSummaryInput)),
        generateExecutiveBrief(canadaTop.map(toArticleSummaryInput)),
        summarizeGlobalArticles(globalTop.map(toGlobalArticleSummaryInput)),
        generateGlobalBrief(globalTop.map(toGlobalArticleSummaryInput)),
    ])

    const generatedAt = new Date().toISOString()
    const bundle = {
        canada: {
            summaries: summaryMapToRecord(canadaSummaryMap),
            executiveBrief: canadaBrief,
            generatedAt,
        },
        global: {
            summaries: summaryMapToRecord(globalSummaryMap),
            executiveBrief: globalBrief,
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
            globalVisibleStories: globalStories.length,
            globalSummaryTarget: globalTop.length,
        },
    }
}

export async function hydrateCanadaStories(stories: Story[]) {
    const payload = await readDashboardEnrichment("canada")
    if (!payload) {
        return { stories, executiveBrief: null as string[] | null, generatedAt: null as string | null }
    }

    const enrichedStories = stories.map((story) => ({
        ...story,
        aiSummary: payload.summaries[story.headline] || story.aiSummary,
    }))

    return {
        stories: enrichedStories,
        executiveBrief: payload.executiveBrief,
        generatedAt: payload.generatedAt,
    }
}

export async function hydrateGlobalStories(stories: GlobalStory[]) {
    const payload = await readDashboardEnrichment("global")
    if (!payload) {
        return { stories, executiveBrief: null as string[] | null, generatedAt: null as string | null }
    }

    const enrichedStories = stories.map((story) => ({
        ...story,
        aiSummary: payload.summaries[story.headline] || story.aiSummary,
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
