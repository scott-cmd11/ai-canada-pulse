"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { TrendsData } from "@/lib/trends-client"
import { useChartTheme } from "@/hooks/useChartTheme"
import echarts from "@/lib/echarts-custom"

const ReactECharts = dynamic(() => import("echarts-for-react/lib/core"), { ssr: false })

export default function TrendsSection() {
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const ct = useChartTheme()

  useEffect(() => {
    fetch("/api/v1/trends")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
      })
      .catch((err) => console.warn("[TrendsSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  const sectionTitle = "AI Tool Adoption Curve"

  if (loading) {
    return (
      <section>
        <div className="section-header"><h2>{sectionTitle}</h2></div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium text-slate-500">Loading AI adoption data...</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <div className="section-header"><h2>{sectionTitle}</h2></div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium text-slate-500">Data unavailable for AI tool trends.</p>
        </div>
      </section>
    )
  }

  // Distinct, visually separated colors for each AI tool
  const lineColors = ["#4338CA", "#0EA5E9", "#F59E0B", "#10B981"]

  const option: Record<string, unknown> = {
    aria: {
      enabled: true,
      decal: { show: true },
      label: { description: "Line chart showing Google Trends search interest for AI tools in Canada over time, including ChatGPT, GitHub Copilot, Claude, and Midjourney." },
    },
    grid: { top: 40, right: 16, bottom: 24, left: 40 },
    legend: {
      show: true,
      top: 0,
      left: 0,
      textStyle: { color: ct.textSecondary, fontSize: 13, fontWeight: 500 },
      itemWidth: 16,
      itemHeight: 4,
      icon: "roundRect"
    },
    xAxis: {
      type: "category" as const,
      data: data.dates,
      axisLabel: {
        fontSize: 11,
        color: ct.textMuted,
        interval: Math.floor(data.dates.length / 8),
        formatter: (v: string) => {
          const [y, m] = v.split("-")
          return `${m}/${y.slice(2)}`
        },
      },
      axisLine: { lineStyle: { color: ct.axisLine } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 11, color: ct.textMuted },
      splitLine: { lineStyle: { color: ct.splitLine } },
      max: 100,
    },
    series: data.series.map((s, idx) => ({
      name: s.keyword,
      type: "line" as const,
      data: s.values,
      smooth: false,
      symbol: "emptyCircle",
      symbolSize: 4,
      showSymbol: false,
      lineStyle: { width: 2, color: lineColors[idx % lineColors.length] },
      itemStyle: { color: lineColors[idx % lineColors.length] },
      emphasis: { focus: "series" },
    })),
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: ct.tooltipBg,
      borderColor: ct.tooltipBorder,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: ct.tooltipText, fontSize: 13 },
    },
    animation: false,
  }

  return (
    <section>
      <div className="section-header"><h2>{sectionTitle}</h2></div>
      <div className="saas-card p-5 sm:p-6 lg:p-8 flex flex-col border-t-4 border-t-indigo-700">
        <div className="w-full min-h-[300px]">
          <ReactECharts echarts={echarts} option={option} style={{ height: '300px', width: '100%' }} />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
          <p>
            Relative search interest (0–100), Jan 2022 → Present
          </p>
        </div>
      </div>
    </section>
  )
}
