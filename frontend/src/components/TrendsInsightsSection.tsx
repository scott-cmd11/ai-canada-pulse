"use client"

import { useState, useEffect } from "react"
import type { ProvinceInterest } from "@/lib/trends-regional-client"

interface InsightBlock {
    title: string
    icon: string
    color: string
    bgColor: string
    borderColor: string
    bullets: string[]
}

const insights: InsightBlock[] = [
    {
        title: "Practical Application Over Definitions",
        icon: "🔧",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        bullets: [
            "\"How to use AI\" and \"how to use ChatGPT for...\" queries are growing faster than definitional searches",
            "Broad searches like \"what is AI\" have plateaued — users now search for \"AI for content creation,\" \"AI coding assistants,\" and \"Generative Engine Optimization\"",
        ],
    },
    {
        title: "Upskilling & Workforce Readiness",
        icon: "📈",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        bullets: [
            "\"AI fundamentals\" searches spiked up to 960% over the past few years",
            "\"AI courses,\" \"ChatGPT training,\" and \"data literacy\" (up 124%) show clear professional development intent",
        ],
    },
    {
        title: "Security, Risk & Regulation",
        icon: "🛡️",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        bullets: [
            "\"Regulation\" and \"dangerous\" consistently emerge as top related queries within the AI topic in Canada",
            "High search volumes for deepfakes, AI bias, and data privacy reflect cautious consumer and enterprise attitudes",
        ],
    },
    {
        title: "Canada's Global Search Positioning",
        icon: "🌐",
        color: "text-slate-700",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        bullets: [
            "Canada ranks 7th among English-speaking countries for AI and data literacy terms — behind Ireland, Australia, UK, and US",
            "Broader global indexes place Canada 23rd of 68 countries for overall AI search interest",
        ],
    },
]

export default function TrendsInsightsSection() {
    const [provinces, setProvinces] = useState<ProvinceInterest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/v1/trends-regional")
            .then((r) => r.json())
            .then((json) => {
                if (json.data?.provinces) setProvinces(json.data.provinces)
            })
            .finally(() => setLoading(false))
    }, [])

    const maxValue = provinces.length > 0 ? Math.max(...provinces.map((p) => p.value)) : 100

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="section-header">AI Search Behaviour — Canada</h2>
                <span className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                    BEHAVIOURAL INSIGHTS
                </span>
            </div>

            <p className="text-sm text-slate-600 mb-6 max-w-3xl leading-relaxed">
                Google Trends data shows Canadian search behaviour around artificial intelligence has shifted from basic curiosity to practical application and professional upskilling, even as Canada&apos;s overall search interest trails behind other major Western nations.
            </p>

            {/* Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {insights.map((insight) => (
                    <div
                        key={insight.title}
                        className={`saas-card p-5 border-l-4 ${insight.borderColor}`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{insight.icon}</span>
                            <h3 className={`text-sm font-bold ${insight.color}`}>{insight.title}</h3>
                        </div>
                        <ul className="flex flex-col gap-2">
                            {insight.bullets.map((bullet, i) => (
                                <li key={i} className="text-xs text-slate-600 leading-relaxed pl-4 relative">
                                    <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    {bullet}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Provincial Breakdown */}
            <div className="saas-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                    AI Search Interest by Province & Territory
                </p>

                {loading && (
                    <div className="py-8 text-center">
                        <div className="animate-pulse text-sm text-slate-500">Loading regional data...</div>
                    </div>
                )}

                {!loading && provinces.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {provinces.map((p) => {
                            const pct = (p.value / maxValue) * 100
                            return (
                                <div key={p.code} className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-slate-700 w-[180px] shrink-0 truncate">
                                        {p.name}
                                    </span>
                                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 w-[32px] text-right">
                                        {p.value}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {!loading && provinces.length === 0 && (
                    <p className="text-sm text-slate-500 py-4 text-center">
                        Regional data unavailable at this time.
                    </p>
                )}

                <p className="text-[10px] text-slate-400 mt-3">
                    Relative search interest (0–100). Higher values indicate greater search volume relative to total searches in that region.
                </p>
            </div>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                Source: Google Trends · Regional breakdown · Updated every 6 hrs
            </p>
        </section>
    )
}
