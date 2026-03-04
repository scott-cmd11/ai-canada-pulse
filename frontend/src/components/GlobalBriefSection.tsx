"use client"

import { useCallback } from "react"
import IntelligenceBrief from "./IntelligenceBrief"
import { usePolling } from "@/hooks/usePolling"
import type { GlobalStory } from "@/lib/global-client"

interface BriefData {
    brief: string[]
    sources: { name: string; count: number }[]
}

/**
 * Fetches executive brief from the global-news API and renders an AI Intelligence Brief
 * for global AI developments.
 */
export default function GlobalBriefSection() {
    const transform = useCallback((json: Record<string, unknown>) => {
        const brief = json.executiveBrief as string[] | undefined
        const stories = json.stories as GlobalStory[] | undefined

        if (!brief || brief.length === 0) return null

        // Count stories by source name
        const sourceCounts = new Map<string, number>()
        if (stories) {
            for (const s of stories) {
                const name = s.sourceName || "Unknown"
                sourceCounts.set(name, (sourceCounts.get(name) || 0) + 1)
            }
        }

        const sources = Array.from(sourceCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        return { brief, sources }
    }, [])

    const { data } = usePolling<BriefData>("/api/v1/global-news", {
        intervalMs: 300_000, // 5 minutes (global news updates less frequently)
        transform,
    })

    return <IntelligenceBrief brief={data?.brief ?? null} sources={data?.sources ?? []} />
}
