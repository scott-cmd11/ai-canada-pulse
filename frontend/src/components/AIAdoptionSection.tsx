"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { StatCanAdoptionData } from "@/lib/statcan-sdmx-client"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

export default function AIAdoptionSection() {
    const [data, setData] = useState<StatCanAdoptionData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Reuse the existing adoption-data or fetch from a new route
        // For now, use the statcan-sdmx route via direct import
        import("@/lib/statcan-sdmx-client")
            .then((mod) => mod.fetchStatCanAdoption())
            .then(setData)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <section>
                <h2 className="section-header mb-4">AI Adoption by Industry</h2>
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm text-slate-500">Loading adoption data...</div>
                </div>
            </section>
        )
    }

    if (!data) return null

    const chartOption = {
        tooltip: {
            trigger: "axis" as const,
            formatter: (params: { name: string; value: number }[]) =>
                `${params[0].name}: ${params[0].value}%`,
        },
        grid: { left: "3%", right: "8%", bottom: "3%", containLabel: true },
        xAxis: {
            type: "value" as const,
            max: 45,
            axisLabel: { formatter: "{value}%", fontSize: 11 },
        },
        yAxis: {
            type: "category" as const,
            data: [...data.industries].reverse().map((i) => i.industry),
            axisLabel: { fontSize: 11 },
        },
        series: [
            {
                name: "Adoption Rate",
                type: "bar" as const,
                data: [...data.industries].reverse().map((i) => i.adoptionRate),
                itemStyle: {
                    color: (params: { value: number }) => {
                        if (params.value >= 30) return "#4338ca"
                        if (params.value >= 15) return "#6366f1"
                        return "#a5b4fc"
                    },
                    borderRadius: [0, 4, 4, 0],
                },
                label: {
                    show: true,
                    position: "right" as const,
                    formatter: "{c}%",
                    fontSize: 10,
                    color: "#64748b",
                },
            },
        ],
    }

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="section-header">AI Adoption by Industry</h2>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                    Avg: {data.averageRate}%
                </span>
            </div>

            <div className="saas-card p-5">
                <p className="text-xs text-slate-500 mb-1">
                    % of businesses planning to adopt AI software in next 12 months ({data.surveyPeriod})
                </p>
                <ReactECharts
                    option={chartOption}
                    style={{ height: "400px", width: "100%" }}
                    opts={{ renderer: "svg" }}
                />
            </div>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                Source: Statistics Canada, Canadian Survey on Business Conditions (PID 3310100001)
            </p>
        </section>
    )
}
