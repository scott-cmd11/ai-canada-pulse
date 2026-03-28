"use client"

import dynamic from "next/dynamic"
import type { DataPoint } from "@/lib/indicators-data"
import { useChartTheme } from "@/hooks/useChartTheme"
import echarts from "@/lib/echarts-custom"

const ReactECharts = dynamic(() => import("echarts-for-react/lib/core"), { ssr: false })

interface Props {
  title: string
  data: DataPoint[]
  unit: string
  color: string // Preserving the prop interface, but we will mostly use CSS variables now
  description: string
  sourceLabel?: string
  sourceUrl?: string
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

export default function IndicatorChart({ title, data, unit, description, sourceLabel, sourceUrl }: Props) {
  const ct = useChartTheme()
  if (data.length === 0) {
    return (
      <div className="saas-card p-5 border-t-4 border-t-indigo-700">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>{description}</p>
        <div className="flex items-center justify-center h-[200px] rounded border border-dashed" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Connecting to data source...</p>
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

  const option: Record<string, unknown> = {
    aria: {
      enabled: true,
      decal: { show: true },
      label: { description: `Area chart showing ${title} over time. ${description}` },
    },
    grid: { top: 16, right: 16, bottom: 24, left: 40 },
    xAxis: {
      type: "category" as const,
      data: dates,
      axisLabel: {
        fontSize: 11,
        color: ct.textMuted,
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
      axisLabel: { fontSize: 11, color: ct.textMuted, formatter: axisFormatter(unit) },
      splitLine: { lineStyle: { color: ct.splitLine } },
    },
    series: [
      {
        type: "line" as const,
        data: values,
        smooth: false,
        symbol: "circle",
        symbolSize: 4,
        showSymbol: false,
        lineStyle: { width: 2, color: ct.accent },
        itemStyle: { color: ct.accent },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: ct.accentDim },
              { offset: 1, color: "rgba(67, 56, 202, 0.0)" },
            ],
          },
        },
      },
    ],
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: ct.tooltipBg,
      borderColor: ct.tooltipBorder,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: ct.tooltipText, fontSize: 12 },
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0]
        return `${p.name}<br/><b style="color: ${ct.tooltipValue}; font-size: 14px;">${formatValue(p.value, unit)}</b>`
      },
    },
    animation: false,
  }

  return (
    <div className="saas-card p-5 border-t-4 border-t-indigo-700 flex flex-col h-full">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold leading-snug pr-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xl sm:text-2xl font-bold tracking-tight leading-none mb-1" style={{ color: 'var(--text-primary)' }}>
            {formatValue(latest, unit)}
          </span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${delta > 0 ? "bg-red-50 text-red-700" : delta < 0 ? "bg-green-50 text-green-700" : ""}`} style={delta === 0 ? { backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' } : {}}>
            {deltaFormatted}
          </span>
        </div>
      </div>
      <p className="text-sm mb-6 leading-relaxed flex-grow" style={{ color: 'var(--text-secondary)' }}>{description}</p>

      {/* Use min-h instead of fixed height so it can flex in grid */}
      <div className="min-h-[220px] w-full mt-auto">
        <ReactECharts echarts={echarts} option={option} style={{ height: '100%', width: '100%' }} />
      </div>

      {sourceLabel && (
        <p className="text-[11px] font-semibold uppercase tracking-wider mt-4 pt-4 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
          SOURCE: {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--text-muted)' }}>{sourceLabel}</a>
          ) : sourceLabel}
        </p>
      )}
    </div>
  )
}
