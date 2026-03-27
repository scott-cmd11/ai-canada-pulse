"use client"

import { useState, useEffect } from "react"
import { useStories } from "@/hooks/useStories"

export default function LiveTicker() {
    const { stories: allStories } = useStories()
    const stories = allStories.slice(0, 8)

    const [currentIndex, setCurrentIndex] = useState(0)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (!stories || stories.length <= 1) return

        const interval = setInterval(() => {
            setVisible(false)
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % stories.length)
                setVisible(true)
            }, 400)
        }, 6000)

        return () => clearInterval(interval)
    }, [stories])

    if (!stories || stories.length === 0) return null

    const story = stories[currentIndex % stories.length]

    const categoryColors: Record<string, { bg: string; text: string }> = {
        "Policy & Regulation": { bg: 'color-mix(in srgb, #3b82f6 12%, var(--surface-primary))', text: '#3b82f6' },
        "Industry & Startups": { bg: 'color-mix(in srgb, #10b981 12%, var(--surface-primary))', text: '#10b981' },
        "Research & Development": { bg: 'color-mix(in srgb, #8b5cf6 12%, var(--surface-primary))', text: '#8b5cf6' },
        "Funding & Investment": { bg: 'color-mix(in srgb, #f59e0b 12%, var(--surface-primary))', text: '#f59e0b' },
    }
    const catStyle = categoryColors[story.category] || { bg: 'color-mix(in srgb, var(--text-muted) 12%, var(--surface-primary))', text: 'var(--text-muted)' }

    return (
        <div
            className="w-full border-b overflow-hidden"
            style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-subtle)',
            }}
        >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center gap-3">
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Live</span>
                </div>

                <div
                    className="h-3 w-px shrink-0"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--text-primary) 60%, transparent)' }}
                ></div>

                <div
                    className="flex-1 min-w-0 flex items-center gap-2 transition-all duration-300 ease-in-out"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateY(0)" : "translateY(-6px)",
                    }}
                >
                    <span
                        className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
                    >
                        {story.category?.split(" ")[0]}
                    </span>

                    <a
                        href={story.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs truncate transition-colors hover:underline"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {story.headline}
                    </a>

                    <span className="hidden sm:inline text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                        | {story.sourceName}
                    </span>
                </div>

                <span className="text-[10px] font-mono shrink-0 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                    {(currentIndex % stories.length) + 1}/{stories.length}
                </span>
            </div>
        </div>
    )
}
