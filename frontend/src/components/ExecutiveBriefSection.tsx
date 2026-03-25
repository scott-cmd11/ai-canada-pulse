"use client"

import { useMemo } from "react"
import IntelligenceBrief from "./IntelligenceBrief"
import { useStories } from "@/hooks/useStories"

export default function ExecutiveBriefSection() {
    const { stories, executiveBrief } = useStories()

    const sources = useMemo(() => {
        const sourceCounts = new Map<string, number>()
        for (const s of stories) {
            const name = s.sourceName || "Unknown"
            sourceCounts.set(name, (sourceCounts.get(name) || 0) + 1)
        }
        return Array.from(sourceCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
    }, [stories])

    return <IntelligenceBrief brief={executiveBrief.length > 0 ? executiveBrief : null} sources={sources} />
}
