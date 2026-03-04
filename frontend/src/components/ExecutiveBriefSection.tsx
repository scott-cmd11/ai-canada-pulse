"use client"

import { useCallback } from "react"
import IntelligenceBrief from "./IntelligenceBrief"
import { usePolling } from "@/hooks/usePolling"

/**
 * Fetches executive brief from the stories API and renders the AI Intelligence Brief.
 * Auto-refreshes every 2 minutes. Designed to sit between Top Briefing and Latest Developments.
 */
export default function ExecutiveBriefSection() {
    const transform = useCallback((json: Record<string, unknown>) => {
        const brief = json.executiveBrief as string[] | undefined
        return brief && brief.length > 0 ? brief : null
    }, [])

    const { data: brief } = usePolling<string[]>("/api/v1/stories", {
        intervalMs: 120_000,
        transform,
    })

    return <IntelligenceBrief brief={brief} />
}
