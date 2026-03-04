"use client"

import { useState, useEffect } from "react"
import type { CountryResearch } from "@/lib/global-client"

export default function GlobalResearchSection() {
    const [data, setData] = useState<CountryResearch[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/v1/global-research")
            .then((r) => r.json())
            .then((j) => { if (j.data) setData(j.data) })
            .catch((err) => console.warn("[GlobalResearchSection]", err))
            .finally(() => setLoading(false))
    }, [])

    const maxCount = data.length > 0 ? data[0].paperCount : 1

    return (
        <section>
            <div className="section-header">
                <h2>AI Research Output by Country</h2>
            </div>

            {loading && (
                <div className="saas-card p-8 text-center">
                    <p className="text-sm text-slate-500 animate-pulse">Loading global research data...</p>
                </div>
            )}

            {!loading && data.length > 0 && (
                <div className="saas-card p-5">
                    <div className="flex flex-col gap-2">
                        {data.map((item, i) => {
                            const pct = Math.round((item.paperCount / maxCount) * 100)
                            return (
                                <div key={item.code} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5 text-right">{i + 1}</span>
                                    <span className={`text-sm font-semibold w-[140px] truncate ${item.isCanada ? "text-indigo-700" : "text-slate-700"}`}>
                                        {item.isCanada ? "🇨🇦 " : ""}{item.country}
                                    </span>
                                    <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                                        <div
                                            className={`h-full rounded transition-all duration-700 ${item.isCanada
                                                ? "bg-gradient-to-r from-violet-500 to-violet-600"
                                                : "bg-gradient-to-r from-slate-300 to-slate-400"
                                                }`}
                                            style={{ width: `${Math.max(pct, 2)}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold w-16 text-right ${item.isCanada ? "text-indigo-700" : "text-slate-500"}`}>
                                        {item.paperCount.toLocaleString()}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <p className="mt-4 text-[11px] text-slate-400">
                        AI/ML papers published in the last 12 months, by institutional country affiliation. Source: OpenAlex.
                    </p>
                </div>
            )}
        </section>
    )
}
