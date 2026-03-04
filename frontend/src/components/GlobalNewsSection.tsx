"use client"

import { useState, useEffect } from "react"
import type { GlobalStory } from "@/lib/global-client"

const REGION_COLORS: Record<string, string> = {
    "United States": "bg-blue-50 text-blue-700 border-blue-200",
    "China": "bg-red-50 text-red-700 border-red-200",
    "EU": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "UK": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Japan": "bg-pink-50 text-pink-700 border-pink-200",
    "South Korea": "bg-violet-50 text-violet-700 border-violet-200",
    "India": "bg-orange-50 text-orange-700 border-orange-200",
    "France": "bg-sky-50 text-sky-700 border-sky-200",
    "Germany": "bg-amber-50 text-amber-700 border-amber-200",
    "Israel": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Australia": "bg-teal-50 text-teal-700 border-teal-200",
    "Global": "bg-slate-50 text-slate-600 border-slate-200",
}

function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (diff < 1) return "Just now"
    if (diff < 60) return `${diff}m ago`
    const h = Math.floor(diff / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

export default function GlobalNewsSection() {
    const [stories, setStories] = useState<GlobalStory[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/v1/global-news")
            .then((r) => r.json())
            .then((j) => { if (j.stories) setStories(j.stories) })
            .catch((err) => console.warn("[GlobalNewsSection]", err))
            .finally(() => setLoading(false))
    }, [])

    return (
        <section>
            {loading && (
                <div className="saas-card p-8 text-center">
                    <p className="text-sm text-slate-500 animate-pulse">Loading global AI news...</p>
                </div>
            )}

            {!loading && stories.length === 0 && (
                <div className="saas-card p-8 text-center">
                    <p className="text-sm text-slate-500">Global news feed currently unavailable.</p>
                </div>
            )}

            {!loading && stories.length > 0 && (
                <div className="relative">
                    <div
                        className="overflow-y-auto overscroll-contain"
                        style={{ maxHeight: "520px", scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                            {stories.map((story, i) => {
                                const colors = REGION_COLORS[story.region] || REGION_COLORS["Global"]
                                // Hide summary if it just repeats the headline
                                const hasUsefulSummary = story.summary &&
                                    !story.headline.startsWith(story.summary.split("  ")[0]) &&
                                    story.summary.length > 20
                                return (
                                    <a
                                        key={i}
                                        href={story.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="saas-card p-4 hover:shadow-md transition-shadow group flex flex-col gap-2"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2 flex-1">
                                                {story.headline}
                                            </h3>
                                            <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors}`}>
                                                {story.region}
                                            </span>
                                        </div>
                                        {hasUsefulSummary && (
                                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                                {story.summary}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-auto">
                                            <span className="font-medium">{story.sourceName}</span>
                                            <span className="text-slate-300">|</span>
                                            <span>{timeAgo(story.publishedAt)}</span>
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                    </div>

                    {/* Bottom fade gradient */}
                    {stories.length > 6 && (
                        <div
                            className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-50 to-transparent rounded-b"
                            aria-hidden="true"
                        />
                    )}
                </div>
            )}
        </section>
    )
}
