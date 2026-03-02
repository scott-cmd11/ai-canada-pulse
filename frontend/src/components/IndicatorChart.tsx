"use client"

import dynamic from "next/dynamic"
import type { DataPoint } from "@/lib/indicators-data"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

interface Props {
  title: string
  data: DataPoint[]
  unit: string
  color: string // Preserving the prop interface, but we will mostly use CSS variables now
  description: string
  sourceLabel?: string
}

function formatValue(value: number, unit: string): string {
  if (unit === "%") return `${value}%`
  if (unit === "index") return value.toFixed(1)
  if (unit === "$M") {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}T`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}B`
    return `$${value.toFixed(0)}M`
  }
  return `${value} ${unit}`
}

function axisFormatter(unit: string): string | ((v: number) => string) {
  if (unit === "%") return "{value}%"
  if (unit === "index") return "{value}"
  if (unit === "$M") {
    return (v: number) => {
      if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}T`
      if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}B`
      return `$${v}M`
    }
  }
  return `{value} ${unit}`
}

export default function IndicatorChart({ title, data, unit, description, sourceLabel }: Props) {
  if (data.length === 0) {
    return (
      <div className="saas-card p-5 border-t-4 border-t-indigo-700">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-sm mt-1 mb-4 text-slate-600">{description}</p>
        <div className="flex items-center justify-center h-[200px] bg-slate-50 rounded border border-dashed border-slate-200">
          <p className="text-sm font-medium text-slate-500">Connecting to data source...</p>
        </div>
      </div>
    )
  }

  const dates = data.map((d) => d.date)
  const values = data.map((d) => d.value)
  const latest = values[values.length - 1]
  const prev = values[values.length - 2]
  const delta = latest - prev
  const deltaFormatted = unit === "$M"
    ? (delta >= 0 ? "+" : "") + formatValue(Math.abs(delta), unit)
    : (delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1))

  const option = {
    grid: { top: 16, right: 16, bottom: 24, left: 40 }, // Tighter grid
    xAxis: {
      type: "category" as const,
      data: dates,
      axisLabel: {
        fontSize: 11,
        color: "#64748B",
        interval: 11,
        formatter: (v: string) => {
          const [y, m] = v.split("-")
          return `${m}/${y.slice(2)}`
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 11, color: "#64748B", formatter: axisFormatter(unit) },
      splitLine: { lineStyle: { color: "#F1F5F9" } }, /* slate-100 */
    },
    series: [
      {
        type: "line" as const,
        data: values,
        smooth: false, // Solid, hard lines for B2B intelligence
        symbol: "circle",
        symbolSize: 4,
        showSymbol: false,
        lineStyle: {
          width: 2,
          color: "#4338CA", // Indigo 700
        },
        itemStyle: { color: "#4338CA" },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(67, 56, 202, 0.15)" },
              { offset: 1, color: "rgba(67, 56, 202, 0.0)" },
            ],
          },
        },
      },
    ],
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "#FFFFFF",
      borderColor: "#E2E8F0", // Slate 200
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#334155", fontSize: 12 }, /* Slate 700 */
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0]
        return `${p.name}<br/><b style="color: #0F172A; font-size: 14px;">${formatValue(p.value, unit)}</b>`
      },
    },
    animation: false,
  }

  return (
    <div className="saas-card p-5 border-t-4 border-t-indigo-700 flex flex-col h-full">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-900 leading-snug pr-4">{title}</h3>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-none mb-1">
            {formatValue(latest, unit)}
          </span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${delta > 0 ? "bg-red-50 text-red-700" : delta < 0 ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
            {deltaFormatted}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed flex-grow">{description}</p>

      {/* Use min-h instead of fixed height so it can flex in grid */}
      <div className="min-h-[220px] w-full mt-auto">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: "svg" }} />
      </div>

      {sourceLabel && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-4 pt-4 border-t border-slate-100">
          SOURCE: {sourceLabel}
        </p>
      )}
    </div>
  )
}
