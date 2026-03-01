"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { JobMarketData } from "@/lib/jobs-client"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

export default function JobMarketSection() {
  const [data, setData] = useState<JobMarketData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/jobs")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
      })
      .catch((err) => console.warn("[JobMarketSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section>
        <div className="section-header">
          <h2>Labour Demand</h2>
        </div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium text-slate-500">Analyzing national labour patterns...</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <div className="section-header">
          <h2>Labour Demand</h2>
        </div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium text-slate-500">
            Labour data currently unavailable.
          </p>
        </div>
      </section>
    )
  }

  // Check if this is fallback data (no sampleJobs means static estimates)
  const isFallback = !data.sampleJobs || data.sampleJobs.length === 0

  const locationOption = {
    grid: { top: 12, right: 40, bottom: 12, left: 4, containLabel: true },
    xAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 11, color: "#64748B" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    yAxis: {
      type: "category" as const,
      data: [...data.topLocations].reverse().map((d) => d.location),
      axisLabel: { fontSize: 11, fontWeight: 500, color: "#334155", width: 100, overflow: "break" as const },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar" as const,
        data: [...data.topLocations].reverse().map((d) => d.count),
        barWidth: 14,
        itemStyle: {
          color: "#0284C7",
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right" as const,
          fontSize: 11,
          fontWeight: 600,
          color: "#475569",
        },
      },
    ],
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const, shadowStyle: { color: "rgba(241, 245, 249, 0.5)" } },
      backgroundColor: "#FFFFFF",
      borderColor: "#E2E8F0",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#334155", fontSize: 13 },
    },
    animation: false
  }

  return (
    <section>
      <div className="section-header">
        <h2>Labour Demand</h2>
      </div>

      {/* KPI Row — stacks on narrow viewports */}
      <div className="saas-card mb-6 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Active Postings
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">
            {data.totalAIJobs.toLocaleString()}
          </p>
        </div>

        {data.averageSalary && (
          <div className="p-5 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Avg. Base Salary
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">
              ${Math.round(data.averageSalary / 1000)}k <span className="text-sm font-medium text-slate-400">CAD</span>
            </p>
          </div>
        )}
      </div>

      {/* Main content — stacks on narrow viewports */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Role Cluster list */}
        <div className="saas-card p-5 lg:col-span-2 border-t-4 border-t-sky-700">
          <p className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Demand by Role Cluster
          </p>
          <div className="space-y-3">
            {data.searchTerms.map((t) => (
              <div key={t.term} className="flex justify-between items-center gap-3 text-sm">
                <span className="font-medium text-slate-600 min-w-0">{t.term}</span>
                <span className="font-bold text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-100 shrink-0 tabular-nums">
                  {t.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Distribution chart */}
        <div className="saas-card p-5 lg:col-span-3 flex flex-col">
          <p className="text-sm font-bold text-slate-900 mb-4">
            Regional Distribution
          </p>
          <div className="flex-1 min-h-[250px] w-full">
            <ReactECharts
              option={locationOption}
              style={{ height: '280px', width: '100%' }}
              opts={{ renderer: "svg" }}
            />
          </div>
        </div>
      </div>

      {/* Data source attribution */}
      {isFallback && (
        <p className="mt-4 text-[11px] font-medium text-slate-400 italic">
          Estimates based on ISED Canada, CIFAR, and Statistics Canada public reports. Live job feed integration pending.
        </p>
      )}
    </section>
  )
}
