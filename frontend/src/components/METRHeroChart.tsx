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

function formatHours(hours: number): string {
    if (hours < 1 / 60) return `${(hours * 3600).toFixed(0)}s`
    if (hours < 0.75) return `${(hours * 60).toFixed(0)}m`
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

// Green = SOTA, Grey = non-SOTA (matching METR's original chart)
const SOTA_COLOR = "#22C55E"    // green-500
const NON_SOTA_COLOR = "#9CA3AF" // gray-400

// Task annotation reference lines (from METR's chart)
const TASK_ANNOTATIONS = [
    { hours: 1, label: "Fix bugs in small Python libraries" },
    { hours: 2.5, label: "Exploit a buffer overflow in libiec61850" },
    { hours: 4, label: "Train adversarially robust image model" },
    { hours: 8, label: "Exploit a vulnerable Ethereum smart contract" },
]

// Models to always label
const LABELED_MODELS = new Set([
    "GPT-2", "Davinci 002", "GPT-3.5 Turbo", "GPT-4",
    "o3", "GPT-5", "Claude Opus 4.5", "GPT-5.2", "Claude Opus 4.6",
    "GPT-5.3 Codex",
])

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
        const yMax = Math.ceil(maxP50 + 1)

        // Build SOTA scatter series (green)
        const sotaModels = validModels.filter((m) => m.isSota)
        const nonSotaModels = validModels.filter((m) => !m.isSota)

        const makeScatterData = (models: METRModel[], color: string) =>
            models.map((m) => ({
                value: [toDecimalYear(m.releaseDate)!, m.p50Hours],
                model: m,
                itemStyle: { color, borderColor: "rgba(255,255,255,0.25)", borderWidth: 1 },
            }))

        // Trend line: sort SOTA models by date, generate a smooth exponential curve
        const sotaSorted = [...sotaModels].sort(
            (a, b) => toDecimalYear(a.releaseDate)! - toDecimalYear(b.releaseDate)!
        )
        // Simple exponential fit: use first and last SOTA points
        const trendLineData: Array<[number, number]> = []
        if (sotaSorted.length >= 2) {
            const first = sotaSorted[0]
            const last = sotaSorted[sotaSorted.length - 1]
            const x0 = toDecimalYear(first.releaseDate)!
            const x1 = toDecimalYear(last.releaseDate)!
            const y0 = Math.max(first.p50Hours, 0.01)
            const y1 = last.p50Hours
            const k = Math.log(y1 / y0) / (x1 - x0)
            for (let x = x0; x <= x1 + 0.05; x += 0.05) {
                const y = y0 * Math.exp(k * (x - x0))
                if (y <= yMax * 1.1) trendLineData.push([x, y])
            }
        }

        // CI error bars for all models
        const errorBarSeries = validModels.map((m) => {
            const x = toDecimalYear(m.releaseDate)!
            const color = m.isSota ? SOTA_COLOR : NON_SOTA_COLOR
            return {
                type: "line" as const,
                data: [[x, m.p50CILow], [x, m.p50CIHigh]] as Array<[number, number]>,
                symbol: "none",
                lineStyle: { color, width: 1.5, opacity: 0.35 },
                silent: true,
                z: 1,
            }
        })

        return {
            grid: {
                left: 50,
                right: 20,
                top: 15,
                bottom: 30,
            },
            xAxis: {
                type: "value" as const,
                min: 2019,
                max: 2026.5,
                axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
                axisLabel: {
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 10,
                    fontWeight: 500,
                    formatter: (val: number) => Math.floor(val).toString(),
                },
                splitLine: { show: false },
                axisTick: { show: false },
            },
            yAxis: {
                type: "value" as const,
                min: 0,
                max: yMax,
                axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
                axisLabel: {
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 10,
                    fontWeight: 500,
                    formatter: (val: number) => {
                        if (val === 0) return "0"
                        if (val < 1) return `${Math.round(val * 60)} min`
                        return `${val} hours`
                    },
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
                    return `<b style="color:#fff">${m.name}</b><br/>` +
                        `<span style="color:#94A3B8">${m.releaseDate}</span><br/>` +
                        `<b>50%:</b> ${formatHours(m.p50Hours)}` +
                        `<br/><b>80%:</b> ${formatHours(m.p80Hours)}` +
                        (m.isSota ? '<br/><span style="color:#22C55E">★ SOTA</span>' : "")
                },
            },
            series: [
                // Error bars
                ...errorBarSeries,
                // Trend line (dashed green)
                {
                    type: "line" as const,
                    data: trendLineData,
                    symbol: "none",
                    lineStyle: {
                        color: SOTA_COLOR,
                        width: 2,
                        type: "dashed" as const,
                        opacity: 0.5,
                    },
                    smooth: true,
                    silent: true,
                    z: 2,
                },
                // SOTA models (green)
                {
                    type: "scatter" as const,
                    data: makeScatterData(sotaModels, SOTA_COLOR),
                    symbolSize: 10,
                    z: 10,
                    label: {
                        show: true,
                        formatter: (params: { data: { model: METRModel } }) =>
                            LABELED_MODELS.has(params.data.model.name) ? params.data.model.name : "",
                        position: "right" as const,
                        fontSize: 9,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.75)",
                        distance: 6,
                    },
                },
                // Non-SOTA models (grey)
                {
                    type: "scatter" as const,
                    data: makeScatterData(nonSotaModels, NON_SOTA_COLOR),
                    symbolSize: 8,
                    z: 9,
                    label: {
                        show: true,
                        formatter: (params: { data: { model: METRModel } }) =>
                            LABELED_MODELS.has(params.data.model.name) ? params.data.model.name : "",
                        position: "right" as const,
                        fontSize: 9,
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.45)",
                        distance: 6,
                    },
                },
            ],
            // Task annotations as horizontal mark lines via graphic elements
            graphic: TASK_ANNOTATIONS.filter((a) => a.hours <= yMax).map((a) => ({
                type: "group" as const,
                // positioned via convertToPixel in onChartReady — but we use markLine instead
            })),
            animation: false,
        }
    }, [data])

    // Add task annotation markLines to the SOTA scatter series
    const chartOptionWithAnnotations = useMemo(() => {
        if (!chartOption || !data) return chartOption
        const validModels = data.models.filter((m) => toDecimalYear(m.releaseDate) !== null)
        const maxP50 = Math.max(...validModels.map((m) => m.p50CIHigh || m.p50Hours))
        const yMax = Math.ceil(maxP50 + 1)

        // Find the SOTA scatter series (second-to-last series) and add markLine
        const seriesCopy = [...chartOption.series]
        const sotaSeriesIdx = seriesCopy.length - 2 // SOTA scatter
        if (sotaSeriesIdx >= 0) {
            seriesCopy[sotaSeriesIdx] = {
                ...seriesCopy[sotaSeriesIdx],
                markLine: {
                    silent: true,
                    symbol: "none",
                    lineStyle: {
                        color: "rgba(255,255,255,0.12)",
                        type: "dashed" as const,
                        width: 1,
                    },
                    label: {
                        position: "insideStartTop" as const,
                        fontSize: 8,
                        color: "rgba(255,255,255,0.35)",
                        formatter: (params: { name: string }) => params.name,
                    },
                    data: TASK_ANNOTATIONS.filter((a) => a.hours <= yMax).map((a) => ({
                        yAxis: a.hours,
                        name: a.label,
                    })),
                },
            }
        }
        return { ...chartOption, series: seriesCopy }
    }, [chartOption, data])

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
                {chartOptionWithAnnotations && (
                    <ReactECharts
                        option={chartOptionWithAnnotations}
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
