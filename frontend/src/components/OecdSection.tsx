"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { OecdData } from "@/lib/oecd-client"
import SourceAttribution from '@/components/SourceAttribution'
import { SectionSkeleton } from '@/components/Skeleton'
import echarts from "@/lib/echarts-custom"

const ReactECharts = dynamic(() => import("echarts-for-react/lib/core"), { ssr: false })

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
        return <SectionSkeleton title="OECD Policy Tracker" variant="table" />
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
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
                    Canada ranks #{data.canadaRank}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="saas-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                        AI Publications by Country
                    </p>
                    <ReactECharts
                        echarts={echarts}
                        option={chartOption}
                        style={{ height: "350px", width: "100%" }}
                    />
                </div>

                <div className="saas-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                        National AI Policies
                    </p>
                    <div className="flex flex-col gap-2">
                        {sorted.slice(0, 8).map((c) => {
                            const isCanada = c.country === "Canada"
                            const maxPolicies = Math.max(...sorted.map((x) => x.policies))
                            const pct = (c.policies / maxPolicies) * 100
                            return (
                                <div key={c.country} className="flex items-center gap-3">
                                    <span
                                        className={`text-xs w-[90px] shrink-0 ${isCanada ? "font-bold" : ""}`}
                                        style={{ color: isCanada ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                                    >
                                        {c.country}
                                    </span>
                                    <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${pct}%`, backgroundColor: isCanada ? 'var(--accent-primary)' : 'var(--border-subtle)' }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold w-[30px] text-right" style={{ color: isCanada ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                                        {c.policies}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
                        Total global AI policies tracked: {data.totalGlobalPolicies}
                    </p>
                </div>
            </div>

            <SourceAttribution sourceId="oecd" />
        </section>
    )
}
