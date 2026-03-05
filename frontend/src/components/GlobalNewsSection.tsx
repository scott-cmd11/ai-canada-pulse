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
                        style={{ maxHeight: "640px", scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
                    >
                        <div className="flex flex-col gap-3 pb-4">
                            {stories.map((story, i) => {
                                const colors = REGION_COLORS[story.region] || REGION_COLORS["Global"]
                                const hasUsefulSummary = !story.aiSummary && story.summary &&
                                    !story.headline.startsWith(story.summary.split("  ")[0]) &&
                                    story.summary.length > 20
                                return (
                                    <article
                                        key={i}
                                        className="saas-card bg-white p-5 flex flex-col sm:flex-row gap-4"
                                    >
                                        <div className="flex sm:flex-col sm:w-32 shrink-0 gap-3 sm:gap-1.5 mt-0.5">
                                            <span className="text-xs font-medium text-slate-500">
                                                {timeAgo(story.publishedAt)}
                                            </span>
                                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border self-start ${colors}`}>
                                                {story.region}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-slate-900 leading-snug">
                                                <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline transition-colors">
                                                    {story.headline}
                                                </a>
                                            </h3>

                                            {story.aiSummary ? (
                                                <p className="text-sm text-slate-700 leading-relaxed mt-1">
                                                    <span className="text-indigo-500 text-xs mr-1">✦</span>
                                                    {story.aiSummary}
                                                </p>
                                            ) : hasUsefulSummary ? (
                                                <p className="text-sm text-slate-600 leading-relaxed mt-1">
                                                    {story.summary}
                                                </p>
                                            ) : null}

                                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                                                {story.sourceName && <span>{story.sourceName}</span>}
                                                {story.sourceName && <span className="text-slate-300">•</span>}
                                                <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">Read article →</a>
                                            </div>
                                        </div>
                                    </article>
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
