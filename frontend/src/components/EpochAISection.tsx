"use client"

import { useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { usePolling } from "@/hooks/usePolling"
import SourceAttribution from '@/components/SourceAttribution'
import type { METRModel, METRStats } from "@/lib/epoch-client"
import echarts from "@/lib/echarts-custom"

const ReactECharts = dynamic(() => import("echarts-for-react/lib/core"), { ssr: false })

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

/** Format date string into human-readable format */
function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr + "T00:00:00")
        return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })
    } catch {
        return dateStr
    }
}

/** Convert date to decimal year */
function toDecimalYear(dateStr: string): number | null {
    const d = new Date(dateStr + "T00:00:00")
    if (isNaN(d.getTime())) return null
    const year = d.getFullYear()
    if (year < 2018 || year > 2030) return null
    const startOfYear = new Date(year, 0, 1).getTime()
    const endOfYear = new Date(year + 1, 0, 1).getTime()
    return year + (d.getTime() - startOfYear) / (endOfYear - startOfYear)
}

// Model family colors
function getModelColor(name: string): string {
    if (name.includes("Claude")) return "#D97706"   // amber
    if (name.includes("GPT") || name.includes("o1") || name.includes("o3") || name.includes("o4")) return "#6366F1" // indigo
    if (name.includes("Gemini")) return "#10B981"    // emerald
    if (name.includes("DeepSeek")) return "#EF4444"  // red
    if (name.includes("Grok")) return "#8B5CF6"      // violet
    if (name.includes("Qwen") || name.includes("Kimi")) return "#06B6D4" // cyan
    if (name.includes("Davinci")) return "#6366F1"   // indigo (OpenAI family)
    return "#94A3B8" // slate
}

function getModelFamily(name: string): string {
    if (name.includes("Claude")) return "Anthropic"
    if (name.includes("GPT") || name.includes("o1") || name.includes("o3") || name.includes("o4") || name.includes("Davinci")) return "OpenAI"
    if (name.includes("Gemini")) return "Google"
    if (name.includes("DeepSeek")) return "DeepSeek"
    if (name.includes("Grok")) return "xAI"
    if (name.includes("Qwen")) return "Alibaba"
    if (name.includes("Kimi")) return "Moonshot"
    return "Other"
}

// Task annotations for context (matching METR's original chart)
const TASK_ANNOTATIONS = [
    { hours: 1, label: "Fix bugs in small Python libraries" },
    { hours: 4, label: "Train adversarially robust image model" },
    { hours: 8, label: "Exploit a vulnerable Ethereum smart contract" },
]

export default function EpochAISection() {
    const transform = useCallback((json: Record<string, unknown>) => {
        const models = json.models as METRModel[] | undefined
        const stats = json.stats as METRStats | undefined
        if (!models || !stats || models.length === 0) return null
        return { models, stats } as METRData
    }, [])

    const { data, loading, lastUpdated } = usePolling<METRData>("/api/v1/epoch-models", {
        intervalMs: 1_800_000, // 30 minutes
        transform,
    })

    const chartOption = useMemo(() => {
        if (!data) return null

        const validModels = data.models.filter((m) => toDecimalYear(m.releaseDate) !== null)
        const xMax = new Date().getFullYear() + 0.75

        // Y-axis max: round up to nearest nice number
        const maxP50 = Math.max(...validModels.map((m) => m.p50CIHigh || m.p50Hours))
        const yMax = Math.ceil(maxP50 / 2) * 2 // round up to even hours

        // Only label SOTA models + select others to avoid clutter
        const labelSet = new Set<string>()
        // Always label the most recent few and the highest
        const sorted = [...validModels].sort((a, b) => b.p50Hours - a.p50Hours)
        sorted.slice(0, 3).forEach((m) => labelSet.add(m.name))
        // Label a few landmark models
        const landmarks = ["GPT-4", "GPT-4o", "o1", "o3", "GPT-5", "GPT-5.1 Codex Max", "GPT-5.2", "GPT-5.3 Codex", "Claude 3.5 Sonnet", "Claude Opus 4.5", "Claude Opus 4.6"]
        validModels.forEach((m) => {
            if (landmarks.some((l) => m.name === l)) labelSet.add(m.name)
        })

        // Build error bar data (custom rendering via markArea won't look right, use custom series)
        const scatterData = validModels.map((m) => ({
            value: [toDecimalYear(m.releaseDate)!, m.p50Hours],
            model: m,
            itemStyle: {
                color: getModelColor(m.name),
                borderColor: "#fff",
                borderWidth: 1.5,
            },
        }))

        // Error bar lines as a separate series (vertical lines for CI)
        const errorBarData: Array<Array<[number, number]>> = validModels.map((m) => {
            const x = toDecimalYear(m.releaseDate)!
            return [[x, m.p50CILow], [x, m.p50CIHigh]]
        })

        return {
            aria: {
                enabled: true,
                decal: { show: true },
                label: { description: "Chart showing AI model task-completion time horizons over time, with confidence intervals and task difficulty annotations." },
            },
            grid: {
                left: 60,
                right: 30,
                top: 30,
                bottom: 40,
            },
            xAxis: {
                type: "value" as const,
                min: 2019,
                max: xMax,
                axisLine: { lineStyle: { color: "#CBD5E1" } },
                axisLabel: {
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 500,
                    formatter: (val: number) => Math.floor(val).toString(),
                },
                splitLine: { show: false },
            },
            yAxis: {
                type: "value" as const,
                name: "Task Duration (hours)",
                nameTextStyle: {
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 600,
                },
                min: 0,
                max: yMax,
                axisLine: { lineStyle: { color: "#CBD5E1" } },
                axisLabel: {
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 500,
                    formatter: (val: number) => `${val}h`,
                },
                splitLine: {
                    lineStyle: { color: "#F1F5F9", type: "dashed" as const },
                },
            },
            tooltip: {
                trigger: "item" as const,
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                borderWidth: 1,
                padding: [10, 14],
                textStyle: { color: "#334155", fontSize: 12 },
                formatter: (params: { data: { model?: METRModel } }) => {
                    const m = params.data?.model
                    if (!m) return ""
                    return `<b style="color:#0F172A;font-size:13px">${m.name}</b><br/>
            <span style="color:#64748B">${getModelFamily(m.name)} · ${formatDate(m.releaseDate)}</span><br/>
            <b>50% Time Horizon:</b> ${formatHours(m.p50Hours)}<br/>
            <span style="color:#94A3B8;font-size:11px">CI: ${formatHours(m.p50CILow)} – ${formatHours(m.p50CIHigh)}</span><br/>
            <b>80% Time Horizon:</b> ${formatHours(m.p80Hours)}<br/>
            <b>Avg Score:</b> ${(m.avgScore * 100).toFixed(1)}%`
                },
            },
            // Task annotation lines
            series: [
                // Error bars (CI)
                ...errorBarData.map((segment, i) => ({
                    type: "line" as const,
                    data: segment,
                    symbol: "none",
                    lineStyle: {
                        color: getModelColor(validModels[i].name),
                        width: 1.5,
                        opacity: 0.35,
                    },
                    silent: true,
                    z: 1,
                })),
                // Main scatter points
                {
                    type: "scatter" as const,
                    data: scatterData,
                    symbolSize: 10,
                    z: 10,
                    label: {
                        show: true,
                        formatter: (params: { data: { model: METRModel } }) => {
                            return labelSet.has(params.data.model.name) ? params.data.model.name : ""
                        },
                        position: "right" as const,
                        fontSize: 9,
                        fontWeight: 600,
                        color: "#334155",
                        distance: 8,
                    },
                    // Mark lines for task annotations
                    markLine: {
                        silent: true,
                        symbol: "none",
                        lineStyle: { color: "#E2E8F0", type: "dashed" as const, width: 1 },
                        label: {
                            position: "end" as const,
                            fontSize: 9,
                            color: "#94A3B8",
                            formatter: (params: { name: string }) => params.name,
                        },
                        data: TASK_ANNOTATIONS.filter((a) => a.hours <= yMax).map((a) => ({
                            yAxis: a.hours,
                            name: a.label,
                        })),
                    },
                },
            ],
            animation: false,
        }
    }, [data])

    // Top models sorted by p50 for the table
    const topModels = useMemo(() => {
        if (!data) return []
        return [...data.models]
            .sort((a, b) => b.p50Hours - a.p50Hours)
            .slice(0, 6)
    }, [data])

    if (loading) {
        return (
            <section>
                <h2 className="section-header">AI Capability Tracker</h2>
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>Loading AI capability data from METR...</div>
                </div>
            </section>
        )
    }

    if (!data) {
        return (
            <section>
                <h2 className="section-header">AI Capability Tracker</h2>
                <div className="saas-card p-6 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>AI capability data currently unavailable.</p>
                </div>
            </section>
        )
    }

    const { stats } = data

    return (
        <section>
            <div className="flex items-center justify-between mb-1">
                <h2 className="section-header">AI Capability Tracker</h2>
                <a
                    href="https://metr.org/time-horizons/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold hover:underline uppercase tracking-wider"
                    style={{ color: 'var(--accent-primary)' }}
                >
                    METR.org →
                </a>
            </div>
            <p className="text-sm mb-4 max-w-3xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Measures how long a task (by human completion time) an AI agent can reliably complete.{" "}
                The <strong>50% time horizon</strong> — the task duration at which a model succeeds half the time — has been{" "}
                <strong>doubling every ~{Math.round(stats.doublingTimeDays / 30)} months</strong>.{" "}
                Data from{" "}
                <a href="https://metr.org/time-horizons/" target="_blank" rel="noopener noreferrer" className="hover:underline font-medium" style={{ color: 'var(--accent-primary)' }}>
                    METR
                </a>
                's evaluations of {stats.totalModels} frontier AI models.
            </p>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <StatCard
                    label="Models Evaluated"
                    value={stats.totalModels.toString()}
                    sublabel="Frontier AI agents"
                    color="indigo"
                />
                <StatCard
                    label="Highest Time Horizon"
                    value={formatHours(stats.highestP50Hours)}
                    sublabel="50% success threshold"
                    color="emerald"
                />
                <StatCard
                    label="Capability Doubling"
                    value={`~${Math.round(stats.doublingTimeDays / 30)} months`}
                    sublabel={`${stats.doublingTimeDays} days`}
                    color="violet"
                />
                <StatCard
                    label="Latest Evaluated"
                    value={stats.latestModel?.name || "—"}
                    sublabel={stats.latestModel ? formatDate(stats.latestModel.releaseDate) : ""}
                    color="amber"
                />
            </div>

            {/* Time horizon chart (linear scale) */}
            <div className="saas-card p-4 md:p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                        Task-Completion Time Horizons (50% Success, Linear Scale)
                    </p>
                </div>
                <div className="w-full" style={{ height: 420 }}>
                    {chartOption && (
                        <ReactECharts
                            echarts={echarts}
                            option={chartOption}
                            style={{ height: "100%", width: "100%" }}
                        />
                    )}
                </div>
            </div>

            {/* Top frontier models table */}
            {topModels.length > 0 && (
                <div className="saas-card overflow-hidden">
                    <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 50%, transparent)' }}>
                        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                            Top Frontier Models by Time Horizon
                        </p>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                        {topModels.map((m, i) => (
                            <div key={`${m.id}-${i}`} className="px-5 py-3 flex items-center justify-between gap-4">
                                <div className="min-w-0 flex items-center gap-3">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: getModelColor(m.name) }}
                                    />
                                    <div>
                                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{getModelFamily(m.name)} · {formatDate(m.releaseDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatHours(m.p50Hours)}</p>
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>50% horizon</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{formatHours(m.p80Hours)}</p>
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>80% horizon</p>
                                    </div>
                                    {m.isSota && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                            SOTA
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-2.5 border-t" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'color-mix(in srgb, var(--surface-secondary) 30%, transparent)' }}>
                        <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
                            Data:{" "}
                            <a href="https://metr.org/time-horizons/" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>
                                METR
                            </a>{" "}
                            · Task-Completion Time Horizons v1.1
                        </p>
                    </div>
                </div>
            )}
            <SourceAttribution sourceId="epoch-ai" lastUpdated={lastUpdated} />
        </section>
    )
}

function StatCard({
    label,
    value,
    sublabel,
    color,
}: {
    label: string
    value: string
    sublabel: string
    color: "indigo" | "emerald" | "violet" | "amber"
}) {
    const colorMap = {
        indigo: "text-indigo-700 bg-indigo-50 border-indigo-100",
        emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
        violet: "text-violet-700 bg-violet-50 border-violet-100",
        amber: "text-amber-700 bg-amber-50 border-amber-100",
    }

    return (
        <div className={`saas-card p-4 border ${colorMap[color]}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {label}
            </p>
            <p className={`text-lg sm:text-xl font-bold tracking-tight leading-tight ${colorMap[color].split(" ")[0]}`}>
                {value}
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{sublabel}</p>
        </div>
    )
}
