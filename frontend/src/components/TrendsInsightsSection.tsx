"use client"

import { useState, useEffect } from "react"
import type { ProvinceInterest } from "@/lib/trends-regional-client"

interface TrendsInsightsSectionProps {
    highlightProvince?: string // Province code to visually highlight, e.g. "ON"
}

export default function TrendsInsightsSection({ highlightProvince }: TrendsInsightsSectionProps = {}) {
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

    const TERRITORIES = new Set(["Nunavut", "Yukon Territory", "Northwest Territories"])
    const filtered = provinces.filter((p) => !TERRITORIES.has(p.name))
    const maxValue = filtered.length > 0 ? Math.max(...filtered.map((p) => p.value)) : 100

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="section-header">AI Search Interest by Province</h2>
                <span className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                    LIVE
                </span>
            </div>

            {/* Provincial Breakdown */}
            <div className="saas-card p-5">
                {loading && (
                    <div className="py-8 text-center">
                        <div className="animate-pulse text-sm text-slate-500">Loading regional data...</div>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {filtered.map((p, i) => {
                            const pct = (p.value / maxValue) * 100
                            const isHighlighted = highlightProvince
                                ? p.code === highlightProvince
                                : false
                            const gradient = isHighlighted
                                ? "from-amber-400 to-orange-500"
                                : i % 2 === 0
                                    ? "from-violet-500 to-indigo-600"
                                    : "from-sky-500 to-indigo-500"
                            return (
                                <div
                                    key={p.code}
                                    className={`flex items-center gap-3 rounded-lg px-1 py-0.5 transition-colors ${isHighlighted ? "bg-amber-50" : ""}`}
                                >
                                    <span className={`text-xs w-[180px] shrink-0 truncate ${isHighlighted ? "font-bold text-amber-800" : "font-medium text-slate-700"}`}>
                                        {p.name}
                                    </span>
                                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold w-[32px] text-right ${isHighlighted ? "text-amber-700" : "text-slate-600"}`}>
                                        {p.value}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <p className="text-sm text-slate-500 py-4 text-center">
                        Regional data unavailable at this time.
                    </p>
                )}

                <p className="text-[10px] text-slate-400 mt-3">
                    Relative search interest (0–100). Higher values indicate greater search volume relative to total searches in that region.
                </p>
            </div>
        </section>
    )
}
