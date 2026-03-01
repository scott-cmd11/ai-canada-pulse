"use client"

import { useState, useEffect } from "react"
import type { ProvinceInterest } from "@/lib/trends-regional-client"

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
