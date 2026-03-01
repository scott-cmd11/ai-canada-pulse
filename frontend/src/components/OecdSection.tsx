"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { OecdData } from "@/lib/oecd-client"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

export default function OecdSection() {
    const [data, setData] = useState<OecdData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/v1/oecd")
            .then((r) => r.json())
            .then((json) => { if (json.data) setData(json.data) })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <section>
                <h2 className="section-header mb-4">Global AI Comparison</h2>
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm text-slate-500">Loading OECD data...</div>
                </div>
            </section>
        )
    }

    if (!data) return null

    const sorted = [...data.countries].sort((a, b) => b.publications - a.publications)

    const chartOption = {
        tooltip: { trigger: "axis" as const },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
            type: "value" as const,
            axisLabel: {
                formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v),
                fontSize: 11
            },
        },
        yAxis: {
            type: "category" as const,
            data: sorted.map((c) => c.country).reverse(),
            axisLabel: { fontSize: 11 },
        },
        series: [
            {
                name: "AI Publications",
                type: "bar" as const,
                data: sorted.map((c) => c.publications).reverse(),
                itemStyle: {
                    color: (params: { dataIndex: number }) => {
                        const canadaIdx = sorted.length - 1 - sorted.findIndex((c) => c.country === "Canada")
                        return params.dataIndex === canadaIdx ? "#4338ca" : "#cbd5e1"
                    },
                    borderRadius: [0, 4, 4, 0],
                },
                label: {
                    show: true,
                    position: "right" as const,
                    formatter: (params: { value: number }) =>
                        params.value >= 1000 ? `${(params.value / 1000).toFixed(1)}K` : String(params.value),
                    fontSize: 10,
                    color: "#64748b",
                },
            },
        ],
    }

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="section-header">Global AI Comparison</h2>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                    Canada ranks #{data.canadaRank}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="saas-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        AI Publications by Country
                    </p>
                    <ReactECharts
                        option={chartOption}
                        style={{ height: "350px", width: "100%" }}
                        opts={{ renderer: "svg" }}
                    />
                </div>

                <div className="saas-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        National AI Policies
                    </p>
                    <div className="flex flex-col gap-2">
                        {sorted.slice(0, 8).map((c) => {
                            const isCanada = c.country === "Canada"
                            const maxPolicies = Math.max(...sorted.map((x) => x.policies))
                            const pct = (c.policies / maxPolicies) * 100
                            return (
                                <div key={c.country} className="flex items-center gap-3">
                                    <span className={`text-xs w-[90px] shrink-0 ${isCanada ? "font-bold text-indigo-700" : "text-slate-600"}`}>
                                        {c.country}
                                    </span>
                                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${isCanada ? "bg-indigo-600" : "bg-slate-300"}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold w-[30px] text-right ${isCanada ? "text-indigo-700" : "text-slate-600"}`}>
                                        {c.policies}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3">
                        Total global AI policies tracked: {data.totalGlobalPolicies}
                    </p>
                </div>
            </div>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                Source: OECD AI Policy Observatory
            </p>
        </section>
    )
}
