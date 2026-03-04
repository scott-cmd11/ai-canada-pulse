"use client"

import { useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { usePolling } from "@/hooks/usePolling"
import type { METRModel, METRStats } from "@/lib/epoch-client"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

interface METRData {
    models: METRModel[]
    stats: METRStats
}

/** Format hours into readable duration */
function formatHours(hours: number): string {
    if (hours < 1 / 60) return `${(hours * 3600).toFixed(0)}s`
    if (hours < 1) return `${(hours * 60).toFixed(0)}m`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${(hours / 24).toFixed(1)} days`
}

function toDecimalYear(dateStr: string): number | null {
    const d = new Date(dateStr + "T00:00:00")
    if (isNaN(d.getTime())) return null
    const year = d.getFullYear()
    if (year < 2018 || year > 2030) return null
    const startOfYear = new Date(year, 0, 1).getTime()
    const endOfYear = new Date(year + 1, 0, 1).getTime()
    return year + (d.getTime() - startOfYear) / (endOfYear - startOfYear)
}

function getModelColor(name: string): string {
    if (name.includes("Claude")) return "#F59E0B"
    if (name.includes("GPT") || name.includes("o1") || name.includes("o3") || name.includes("o4")) return "#818CF8"
    if (name.includes("Gemini")) return "#34D399"
    if (name.includes("DeepSeek")) return "#F87171"
    if (name.includes("Grok")) return "#A78BFA"
    if (name.includes("Qwen") || name.includes("Kimi")) return "#22D3EE"
    if (name.includes("Davinci")) return "#818CF8"
    return "#94A3B8"
}

/**
 * Compact METR chart designed for the hero area.
 * Dark-themed to blend with the hero banner gradient.
 */
export default function METRHeroChart() {
    const transform = useCallback((json: Record<string, unknown>) => {
        const models = json.models as METRModel[] | undefined
        const stats = json.stats as METRStats | undefined
        if (!models || !stats || models.length === 0) return null
        return { models, stats } as METRData
    }, [])

    const { data, loading } = usePolling<METRData>("/api/v1/epoch-models", {
        intervalMs: 1_800_000,
        transform,
    })

    const chartOption = useMemo(() => {
        if (!data) return null

        const validModels = data.models.filter((m) => toDecimalYear(m.releaseDate) !== null)
        const maxP50 = Math.max(...validModels.map((m) => m.p50CIHigh || m.p50Hours))
        const yMax = Math.ceil(maxP50 / 2) * 2

        // Label only a few key models
        const labelSet = new Set<string>()
        const sorted = [...validModels].sort((a, b) => b.p50Hours - a.p50Hours)
        sorted.slice(0, 2).forEach((m) => labelSet.add(m.name))
            ;["GPT-4", "o3", "GPT-5"].forEach((l) => {
                const found = validModels.find((m) => m.name === l)
                if (found) labelSet.add(found.name)
            })

        const scatterData = validModels.map((m) => ({
            value: [toDecimalYear(m.releaseDate)!, m.p50Hours],
            model: m,
            itemStyle: {
                color: getModelColor(m.name),
                borderColor: "rgba(255,255,255,0.3)",
                borderWidth: 1,
            },
        }))

        const errorBarData = validModels.map((m) => {
            const x = toDecimalYear(m.releaseDate)!
            return [[x, m.p50CILow], [x, m.p50CIHigh]] as Array<[number, number]>
        })

        return {
            grid: {
                left: 45,
                right: 15,
                top: 15,
                bottom: 30,
            },
            xAxis: {
                type: "value" as const,
                min: 2019,
                max: 2026.5,
                axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
                axisLabel: {
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 10,
                    fontWeight: 500,
                    formatter: (val: number) => Math.floor(val).toString(),
                },
                splitLine: { show: false },
            },
            yAxis: {
                type: "value" as const,
                min: 0,
                max: yMax,
                axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
                axisLabel: {
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 10,
                    fontWeight: 500,
                    formatter: (val: number) => `${val}h`,
                },
                splitLine: {
                    lineStyle: { color: "rgba(255,255,255,0.06)", type: "dashed" as const },
                },
            },
            tooltip: {
                trigger: "item" as const,
                backgroundColor: "rgba(15,23,42,0.95)",
                borderColor: "rgba(99,102,241,0.3)",
                borderWidth: 1,
                padding: [8, 12],
                textStyle: { color: "#E2E8F0", fontSize: 11 },
                formatter: (params: { data: { model?: METRModel } }) => {
                    const m = params.data?.model
                    if (!m) return ""
                    return `<b style="color:#fff">${m.name}</b><br/><span style="color:#94A3B8">${m.releaseDate}</span><br/><b>50%:</b> ${formatHours(m.p50Hours)}`
                },
            },
            series: [
                ...errorBarData.map((segment, i) => ({
                    type: "line" as const,
                    data: segment,
                    symbol: "none",
                    lineStyle: {
                        color: getModelColor(validModels[i].name),
                        width: 1,
                        opacity: 0.25,
                    },
                    silent: true,
                    z: 1,
                })),
                {
                    type: "scatter" as const,
                    data: scatterData,
                    symbolSize: 8,
                    z: 10,
                    label: {
                        show: true,
                        formatter: (params: { data: { model: METRModel } }) => {
                            return labelSet.has(params.data.model.name) ? params.data.model.name : ""
                        },
                        position: "right" as const,
                        fontSize: 9,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.7)",
                        distance: 6,
                    },
                },
            ],
            animation: false,
        }
    }, [data])

    if (loading || !data) {
        return (
            <div className="h-full flex flex-col justify-center items-center gap-2">
                <div className="animate-pulse text-xs text-indigo-300/50">Loading METR data...</div>
            </div>
        )
    }

    const { stats } = data

    return (
        <div className="h-full flex flex-col">
            {/* Title */}
            <div className="flex items-center justify-between mb-2 px-1">
                <div>
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider">
                        AI Capability Growth
                    </p>
                    <p className="text-[10px] text-indigo-300/50 mt-0.5">
                        Task-Completion Time Horizons · 50% Success
                    </p>
                </div>
                <a
                    href="https://metr.org/time-horizons/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-semibold text-indigo-300/60 hover:text-indigo-200 uppercase tracking-wider transition-colors"
                >
                    METR.org →
                </a>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                {chartOption && (
                    <ReactECharts
                        option={chartOption}
                        style={{ height: "100%", width: "100%" }}
                        opts={{ renderer: "svg" }}
                    />
                )}
            </div>

            {/* Bottom stats */}
            <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-4">
                    <div>
                        <p className="text-lg font-black text-white leading-none">{formatHours(stats.highestP50Hours)}</p>
                        <p className="text-[9px] text-indigo-300/50 uppercase font-semibold">Highest Horizon</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div>
                        <p className="text-lg font-black text-white leading-none">~{Math.round(stats.doublingTimeDays / 30)}mo</p>
                        <p className="text-[9px] text-indigo-300/50 uppercase font-semibold">Doubling Time</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div>
                        <p className="text-lg font-black text-white leading-none">{stats.totalModels}</p>
                        <p className="text-[9px] text-indigo-300/50 uppercase font-semibold">Models</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
