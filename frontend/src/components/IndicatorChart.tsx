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
}

export default function IndicatorChart({ title, data, unit, color, description }: Props) {
  const dates = data.map((d) => d.date)
  const values = data.map((d) => d.value)
  const latest = values[values.length - 1]
  const prev = values[values.length - 2]
  const delta = latest - prev
  const deltaStr = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)

  const option = {
    grid: { top: 8, right: 12, bottom: 24, left: 36 },
    xAxis: {
      type: "category" as const,
      data: dates,
      axisLabel: {
        fontSize: 10,
        color: "#9ca3af",
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
      axisLabel: { fontSize: 10, color: "#9ca3af", formatter: `{value}${unit}` },
      splitLine: { lineStyle: { color: "#f3f4f6" } },
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
              { offset: 0, color: color + "30" },
              { offset: 1, color: color + "05" },
            ],
          },
        },
      },
    ],
    tooltip: {
      trigger: "axis" as const,
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0]
        return `${p.name}<br/>${p.value}${unit}`
      },
    },
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold" style={{ color }}>{latest}{unit}</span>
          <span className={`text-xs font-medium ${delta > 0 ? "text-red-500" : delta < 0 ? "text-green-600" : "text-gray-400"}`}>
            {deltaStr}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">{description}</p>
      <ReactECharts option={option} style={{ height: 180 }} opts={{ renderer: "svg" }} />
    </div>
  )
}
