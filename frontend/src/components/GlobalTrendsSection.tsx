"use client"

import { useState, useEffect } from "react"
import type { CountryInterest } from "@/lib/global-client"

export default function GlobalTrendsSection() {
    const [data, setData] = useState<CountryInterest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/v1/global-trends")
            .then((r) => r.json())
            .then((j) => { if (j.data) setData(j.data) })
            .catch((err) => console.warn("[GlobalTrendsSection]", err))
            .finally(() => setLoading(false))
    }, [])

    const maxValue = data.length > 0 ? data[0].value : 100

    return (
        <section>
            <div className="section-header">
                <h2>AI Search Interest by Country</h2>
            </div>

            {loading && (
                <div className="saas-card p-8 text-center">
                    <p className="text-sm text-slate-500 animate-pulse">Loading global trends data...</p>
                </div>
            )}

            {!loading && data.length > 0 && (
                <div className="saas-card p-5">
                    <div className="flex flex-col gap-2">
                        {data.map((item, i) => {
                            const pct = Math.round((item.value / maxValue) * 100)
                            return (
                                <div key={item.code} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5 text-right">{i + 1}</span>
                                    <span className={`text-sm font-semibold w-[140px] truncate ${item.isCanada ? "text-indigo-700" : "text-slate-700"}`}>
                                        {item.isCanada ? "🇨🇦 " : ""}{item.country}
                                    </span>
                                    <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                                        <div
                                            className={`h-full rounded transition-all duration-700 ${item.isCanada
                                                ? "bg-gradient-to-r from-indigo-500 to-indigo-600"
                                                : "bg-gradient-to-r from-slate-300 to-slate-400"
                                                }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold w-8 text-right ${item.isCanada ? "text-indigo-700" : "text-slate-500"}`}>
                                        {item.value}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <p className="mt-4 text-[11px] text-slate-400">
                        Relative search interest (0-100) for &quot;artificial intelligence&quot; over the last 90 days.
                    </p>
                </div>
            )}
        </section>
    )
}
