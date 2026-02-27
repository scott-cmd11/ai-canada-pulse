"use client"

import dynamic from "next/dynamic"
import type { DataPoint } from "@/lib/indicators-data"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

interface Props {
  title: string
  data: DataPoint[]
  unit: string
  color: string
  description: string
  sourceLabel?: string
}

function formatValue(value: number, unit: string): string {
  if (unit === "%") return `${value}%`
  if (unit === "index") return value.toFixed(1)
  return `${value} ${unit}`
}

function axisFormatter(unit: string): string | ((v: number) => string) {
  if (unit === "%") return "{value}%"
  if (unit === "index") return "{value}"
  return `{value} ${unit}`
}

export default function IndicatorChart({ title, data, unit, color, description, sourceLabel }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
        <div className="flex items-center justify-center h-[180px]">
          <p className="text-xs text-slate-600">Awaiting data from Stats Canada...</p>
        </div>
      </div>
    )
  }

  const dates = data.map((d) => d.date)
  const values = data.map((d) => d.value)
  const latest = values[values.length - 1]
  const prev = values[values.length - 2]
  const delta = latest - prev
  const deltaStr = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)

  const option = {
    grid: { top: 8, right: 12, bottom: 24, left: 42 },
    xAxis: {
      type: "category" as const,
      data: dates,
      axisLabel: {
        fontSize: 10,
        color: "#64748b",
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
      axisLabel: { fontSize: 10, color: "#64748b", formatter: axisFormatter(unit) },
      splitLine: { lineStyle: { color: "#334155" } },
    },
    series: [
      {
        type: "line" as const,
        data: values,
        smooth: true,
        symbol: "none",
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + "25" },
              { offset: 1, color: color + "05" },
            ],
          },
        },
      },
    ],
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "#1e293b",
      borderColor: "#334155",
      textStyle: { color: "#f1f5f9", fontSize: 12 },
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0]
        return `${p.name}<br/><b>${formatValue(p.value, unit)}</b>`
      },
    },
  }

  return (
    <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold" style={{ color }}>{formatValue(latest, unit)}</span>
          <span className={`text-xs font-medium ${delta > 0 ? "text-red-400" : delta < 0 ? "text-emerald-400" : "text-slate-500"}`}>
            {deltaStr}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-3">{description}</p>
      <ReactECharts option={option} style={{ height: 180 }} opts={{ renderer: "svg" }} />
      {sourceLabel && (
        <p className="text-[10px] text-slate-600 mt-2">Source: {sourceLabel}</p>
      )}
    </div>
  )
}
