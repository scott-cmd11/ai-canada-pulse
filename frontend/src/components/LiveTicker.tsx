"use client"

import { useState, useEffect, useCallback } from "react"
import { usePolling } from "@/hooks/usePolling"

interface TickerStory {
    headline: string
    category: string
    sourceName: string
    sourceUrl: string
}

export default function LiveTicker() {
    const transform = useCallback((json: Record<string, unknown>) => {
        const stories = json.stories as TickerStory[] | undefined
        return stories && stories.length > 0 ? stories.slice(0, 8) : null
    }, [])

    const { data: stories } = usePolling<TickerStory[]>("/api/v1/stories", {
        intervalMs: 120_000,
        transform,
    })

    const [currentIndex, setCurrentIndex] = useState(0)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (!stories || stories.length <= 1) return

        const interval = setInterval(() => {
            // Fade out
            setVisible(false)

            // After fade-out, switch headline and fade in
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % stories.length)
                setVisible(true)
            }, 400)
        }, 6000)

        return () => clearInterval(interval)
    }, [stories])

    if (!stories || stories.length === 0) return null

    const story = stories[currentIndex % stories.length]

    const categoryColors: Record<string, string> = {
        "Policy & Regulation": "bg-blue-100 text-blue-700",
        "Industry & Startups": "bg-emerald-100 text-emerald-700",
        "Research & Development": "bg-purple-100 text-purple-700",
        "Funding & Investment": "bg-amber-100 text-amber-700",
    }
    const catClass = categoryColors[story.category] || "bg-slate-100 text-slate-600"

    return (
        <div className="w-full bg-slate-900 border-b border-slate-800 overflow-hidden">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center gap-3">
                {/* LIVE dot */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Live</span>
                </div>

                <div className="h-3 w-px bg-slate-700 shrink-0"></div>

                {/* Rotating headline */}
                <div
                    className="flex-1 min-w-0 flex items-center gap-2 transition-all duration-300 ease-in-out"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateY(0)" : "translateY(-6px)",
                    }}
                >
                    <span className={`hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${catClass}`}>
                        {story.category?.split(" ")[0]}
                    </span>

                    <a
                        href={story.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-300 hover:text-white truncate transition-colors"
                    >
                        {story.headline}
                    </a>

                    <span className="hidden sm:inline text-[10px] text-slate-500 shrink-0">
                        — {story.sourceName}
                    </span>
                </div>

                {/* Counter */}
                <span className="text-[10px] text-slate-600 font-mono shrink-0 hidden sm:block">
                    {(currentIndex % stories.length) + 1}/{stories.length}
                </span>
            </div>
        </div>
    )
}
