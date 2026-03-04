"use client"

import { useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { usePolling } from "@/hooks/usePolling"
import type { EpochModel, EpochStats } from "@/lib/epoch-client"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

interface EpochData {
    models: EpochModel[]
    stats: EpochStats
}

/** Format large FLOP values into readable strings like "2.1 × 10²⁵" */
function formatFlop(flop: number): string {
    if (flop <= 0) return "—"
    const exp = Math.floor(Math.log10(flop))
    const mantissa = flop / Math.pow(10, exp)
    const superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹"
    const expStr = String(exp)
        .split("")
        .map((d) => superscripts[parseInt(d)])
        .join("")
    return `${mantissa.toFixed(1)} × 10${expStr}`
}

/** Format parameter count into human-readable string */
function formatParams(params: number | null): string {
    if (!params) return "—"
    if (params >= 1e12) return `${(params / 1e12).toFixed(1)}T`
    if (params >= 1e9) return `${(params / 1e9).toFixed(1)}B`
    if (params >= 1e6) return `${(params / 1e6).toFixed(0)}M`
    return params.toLocaleString()
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

// Domain colors for the chart
const DOMAIN_COLORS: Record<string, string> = {
    Language: "#6366F1",    // indigo
    Vision: "#F59E0B",      // amber
    Multimodal: "#8B5CF6",  // violet
    Speech: "#10B981",      // emerald
    Games: "#EF4444",       // red
    Biology: "#06B6D4",     // cyan
    Robotics: "#F97316",    // orange
    Other: "#94A3B8",       // slate
}

function getDomainColor(domain: string): string {
    for (const [key, color] of Object.entries(DOMAIN_COLORS)) {
        if (domain.toLowerCase().includes(key.toLowerCase())) return color
    }
    return DOMAIN_COLORS.Other
}

export default function EpochAISection() {
    const transform = useCallback((json: Record<string, unknown>) => {
        const models = json.models as EpochModel[] | undefined
        const stats = json.stats as EpochStats | undefined
        if (!models || !stats || models.length === 0) return null
        return { models, stats } as EpochData
    }, [])

    const { data, loading } = usePolling<EpochData>("/api/v1/epoch-models", {
        intervalMs: 1_800_000, // 30 minutes — data updates weekly
        transform,
    })

    const chartOption = useMemo(() => {
        if (!data) return null

        // Convert date to decimal year for value axis (e.g., 2023.5 for July 2023)
        const toDecimalYear = (dateStr: string): number | null => {
            const d = new Date(dateStr + "T00:00:00")
            if (isNaN(d.getTime())) return null
            const year = d.getFullYear()
            if (year < 1990 || year > 2030) return null // filter garbage dates
            const startOfYear = new Date(year, 0, 1).getTime()
            const endOfYear = new Date(year + 1, 0, 1).getTime()
            return year + (d.getTime() - startOfYear) / (endOfYear - startOfYear)
        }

        // Only include models from 2010+ with valid dates for a cleaner chart
        const chartModels = data.models.filter((m) => {
            const dy = toDecimalYear(m.date)
            return dy !== null && dy >= 2010
        })

        // Group by domain for separate series
        const domainGroups = new Map<string, EpochModel[]>()
        for (const m of chartModels) {
            const domain = m.domain.split(",")[0].trim()
            const normalizedDomain = Object.keys(DOMAIN_COLORS).find((k) =>
                domain.toLowerCase().includes(k.toLowerCase())
            ) || "Other"
            if (!domainGroups.has(normalizedDomain)) domainGroups.set(normalizedDomain, [])
            domainGroups.get(normalizedDomain)!.push(m)
        }

        // Find top models to label — keep it sparse to avoid overlap
        const labeledModels = new Set<string>()
        const sortedByCompute = [...chartModels].sort((a, b) => b.trainingCompute - a.trainingCompute)
        sortedByCompute.slice(0, 5).forEach((m) => labeledModels.add(m.name))
        const landmarks = ["GPT-4", "GPT-3", "AlphaGo", "BERT", "AlexNet", "Gemini Ultra"]
        chartModels.forEach((m) => {
            if (landmarks.some((l) => m.name === l)) labeledModels.add(m.name)
        })

        const series = Array.from(domainGroups.entries()).map(([domain, models]) => ({
            name: domain,
            type: "scatter" as const,
            data: models.map((m) => ({
                value: [toDecimalYear(m.date), Math.log10(m.trainingCompute)],
                model: m,
            })),
            symbolSize: (val: number[]) => {
                const logVal = val[1]
                return Math.max(4, Math.min(14, (logVal - 10) * 0.5))
            },
            itemStyle: {
                color: getDomainColor(domain),
                borderColor: "#fff",
                borderWidth: 1,
                opacity: 0.85,
            },
            label: {
                show: true,
                formatter: (params: { data: { model: EpochModel } }) => {
                    return labeledModels.has(params.data.model.name)
                        ? params.data.model.name.length > 20
                            ? params.data.model.name.slice(0, 18) + "…"
                            : params.data.model.name
                        : ""
                },
                position: "top" as const,
                fontSize: 9,
                fontWeight: 600,
                color: "#334155",
                distance: 6,
            },
        }))

        return {
            grid: {
                left: 65,
                right: 20,
                top: 30,
                bottom: 50,
            },
            xAxis: {
                type: "value" as const,
                min: 2010,
                max: 2026,
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
                name: "Training Compute (log₁₀ FLOP)",
                nameTextStyle: {
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: [0, 0, 0, 0],
                },
                axisLine: { lineStyle: { color: "#CBD5E1" } },
                axisLabel: {
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 500,
                    formatter: (val: number) => `10^${val.toFixed(0)}`,
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
                formatter: (params: { data: { model: EpochModel } }) => {
                    const m = params.data.model
                    return `<b style="color:#0F172A;font-size:13px">${m.name}</b><br/>
            <span style="color:#64748B">${m.org}</span><br/>
            <span style="color:#64748B">${formatDate(m.date)}</span><br/>
            <b>Compute:</b> ${formatFlop(m.trainingCompute)}<br/>
            ${m.parameters ? `<b>Parameters:</b> ${formatParams(m.parameters)}` : ""}`
                },
            },
            legend: {
                data: Array.from(domainGroups.keys()),
                bottom: 0,
                textStyle: { fontSize: 10, color: "#64748B", fontWeight: 600 },
                itemWidth: 10,
                itemHeight: 10,
                itemGap: 14,
            },
            animation: false,
            series,
        }
    }, [data])

    // Get the 5 most recent large-scale models for the table
    const recentModels = useMemo(() => {
        if (!data) return []
        return [...data.models]
            .filter((m) => m.trainingCompute >= 1e22)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5)
    }, [data])

    if (loading) {
        return (
            <section>
                <h2 className="section-header">AI Progress Tracker</h2>
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm text-slate-500">Loading AI progress data from Epoch AI...</div>
                </div>
            </section>
        )
    }

    if (!data) {
        return (
            <section>
                <h2 className="section-header">AI Progress Tracker</h2>
                <div className="saas-card p-6 text-center">
                    <p className="text-sm text-slate-500">AI progress data currently unavailable.</p>
                </div>
            </section>
        )
    }

    const { stats } = data

    return (
        <section>
            <div className="flex items-center justify-between mb-1">
                <h2 className="section-header">AI Progress Tracker</h2>
                <a
                    href="https://epoch.ai/data/ai-models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline uppercase tracking-wider"
                >
                    Epoch AI →
                </a>
            </div>
            <p className="text-sm text-slate-600 mb-4 max-w-3xl leading-relaxed">
                Tracks the exponential growth of AI training compute over time. Training compute — measured in floating-point operations (FLOP) —
                has been <strong>doubling every ~{stats.computeDoublingMonths} months</strong>, driving the rapid advancement of AI capabilities.
                Data from{" "}
                <a href="https://epoch.ai/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
                    Epoch AI
                </a>
                's open dataset of {stats.totalModels.toLocaleString()} notable AI models.
            </p>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <StatCard
                    label="Notable Models Tracked"
                    value={stats.totalModels.toLocaleString()}
                    sublabel="Since 1950"
                    color="indigo"
                />
                <StatCard
                    label="Models Released This Year"
                    value={stats.modelsThisYear.toString()}
                    sublabel={new Date().getFullYear().toString()}
                    color="emerald"
                />
                <StatCard
                    label="Compute Doubling Time"
                    value={`~${stats.computeDoublingMonths} months`}
                    sublabel="Exponential growth"
                    color="violet"
                />
                <StatCard
                    label="Largest Training Run"
                    value={formatFlop(stats.largestComputeFlop)}
                    sublabel="FLOP"
                    color="amber"
                />
            </div>

            {/* Training compute chart */}
            <div className="saas-card p-4 md:p-6 mb-4">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-3">
                    Training Compute Over Time (Log Scale)
                </p>
                <div className="w-full" style={{ height: 420 }}>
                    {chartOption && (
                        <ReactECharts
                            option={chartOption}
                            style={{ height: "100%", width: "100%" }}
                            opts={{ renderer: "svg" }}
                        />
                    )}
                </div>
            </div>

            {/* Recent frontier models table */}
            {recentModels.length > 0 && (
                <div className="saas-card overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50">
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
                            Recent Frontier Models
                        </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentModels.map((m, i) => (
                            <div key={`${m.name}-${i}`} className="px-5 py-3 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
                                    <p className="text-xs text-slate-500">{m.org} · {formatDate(m.date)}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {m.parameters && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            {formatParams(m.parameters)}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                                        {formatFlop(m.trainingCompute)}
                                    </span>
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: getDomainColor(m.domain) }}
                                        title={m.domain}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/30">
                        <p className="text-[10px] text-slate-400 italic">
                            Data:{" "}
                            <a href="https://epoch.ai/data/ai-models" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                                Epoch AI
                            </a>{" "}
                            · CC-BY 4.0 License
                        </p>
                    </div>
                </div>
            )}
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
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                {label}
            </p>
            <p className={`text-lg sm:text-xl font-bold tracking-tight leading-tight ${colorMap[color].split(" ")[0]}`}>
                {value}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">{sublabel}</p>
        </div>
    )
}
