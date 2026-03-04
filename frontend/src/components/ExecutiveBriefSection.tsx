"use client"

import { useCallback } from "react"
import IntelligenceBrief from "./IntelligenceBrief"
import { usePolling } from "@/hooks/usePolling"
import type { Story } from "@/lib/mock-data"

interface BriefData {
    brief: string[]
    sources: { name: string; count: number }[]
}

/**
 * Fetches executive brief from the stories API and renders the AI Intelligence Brief.
 * Also extracts source names from the stories used to generate it.
 */
export default function ExecutiveBriefSection() {
    const transform = useCallback((json: Record<string, unknown>) => {
        const brief = json.executiveBrief as string[] | undefined
        const stories = json.stories as Story[] | undefined

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
            .slice(0, 5) // Show top 5 sources

        return { brief, sources }
    }, [])

    const { data } = usePolling<BriefData>("/api/v1/stories", {
        intervalMs: 120_000,
        transform,
    })

    return <IntelligenceBrief brief={data?.brief ?? null} sources={data?.sources ?? []} />
}
