"use client"

import { useState, useEffect } from "react"
import type { Story } from "@/lib/mock-data"
import IntelligenceBrief from "./IntelligenceBrief"

/**
 * Fetches executive brief from the stories API and renders the AI Intelligence Brief.
 * Designed to be inserted between Top Briefing and Latest Developments.
 */
export default function ExecutiveBriefSection() {
    const [brief, setBrief] = useState<string[] | null>(null)

    useEffect(() => {
        fetch("/api/v1/stories")
            .then((res) => res.json())
            .then((json) => {
                if (json.executiveBrief) {
                    setBrief(json.executiveBrief)
                }
            })
            .catch((err) => console.warn("[ExecutiveBrief] fetch failed:", err))
    }, [])

    return <IntelligenceBrief brief={brief} />
}
