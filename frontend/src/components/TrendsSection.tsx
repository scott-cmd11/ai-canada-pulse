"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { TrendsData } from "@/lib/trends-client"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

const KEYWORD_COLORS: Record<string, string> = {
  "artificial intelligence": "#3b82f6",
  "ChatGPT": "#10b981",
  "machine learning": "#f59e0b",
}

export default function TrendsSection() {
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/trends")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
          Search Interest in Canada
        </h2>
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Loading Google Trends data...</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
          Search Interest in Canada
        </h2>
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Unable to load trends data at this time.</p>
        </div>
      </section>
    )
  }

  const option = {
    grid: { top: 30, right: 16, bottom: 24, left: 42 },
    legend: {
      show: true,
      top: 0,
      left: 0,
      textStyle: { color: "#94a3b8", fontSize: 11 },
      itemWidth: 16,
      itemHeight: 2,
    },
    xAxis: {
      type: "category" as const,
      data: data.dates,
      axisLabel: {
        fontSize: 10,
        color: "#64748b",
        interval: Math.floor(data.dates.length / 6),
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
      axisLabel: { fontSize: 10, color: "#64748b" },
      splitLine: { lineStyle: { color: "#334155" } },
      max: 100,
      name: "Interest",
      nameTextStyle: { color: "#64748b", fontSize: 10 },
    },
    series: data.series.map((s) => ({
      name: s.keyword,
      type: "line" as const,
      data: s.values,
      smooth: true,
      symbol: "none",
      lineStyle: { color: KEYWORD_COLORS[s.keyword] || "#64748b", width: 2 },
      areaStyle: {
        color: {
          type: "linear" as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: (KEYWORD_COLORS[s.keyword] || "#64748b") + "18" },
            { offset: 1, color: (KEYWORD_COLORS[s.keyword] || "#64748b") + "03" },
          ],
        },
      },
    })),
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "#1e293b",
      borderColor: "#334155",
      textStyle: { color: "#f1f5f9", fontSize: 12 },
    },
  }

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Search Interest in Canada
      </h2>
      <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4">
        <ReactECharts option={option} style={{ height: 260 }} opts={{ renderer: "svg" }} />
        <p className="text-[10px] text-slate-600 mt-2">
          Source: Google Trends — relative search interest in Canada (0-100 scale, past 12 months)
        </p>
      </div>
    </section>
  )
}
