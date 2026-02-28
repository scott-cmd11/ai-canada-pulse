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
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
          AI Job Market
        </h2>
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Loading AI job market data...</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
          AI Job Market
        </h2>
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">
            AI job market data requires Adzuna API credentials.
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Set ADZUNA_APP_ID and ADZUNA_APP_KEY environment variables to enable.
          </p>
        </div>
      </section>
    )
  }

  const locationOption = {
    grid: { top: 8, right: 55, bottom: 8, left: 4, containLabel: true },
    xAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 10, color: "#64748b" },
      splitLine: { lineStyle: { color: "#334155" } },
    },
    yAxis: {
      type: "category" as const,
      data: [...data.topLocations].reverse().map((d) => d.location),
      axisLabel: { fontSize: 10, color: "#94a3b8", width: 140, overflow: "truncate" as const },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar" as const,
        data: [...data.topLocations].reverse().map((d) => d.count),
        barWidth: 14,
        itemStyle: { color: "#8b5cf6", borderRadius: [0, 2, 2, 0] },
        label: {
          show: true,
          position: "right" as const,
          fontSize: 10,
          color: "#94a3b8",
        },
      },
    ],
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const },
      backgroundColor: "#1e293b",
      borderColor: "#334155",
      textStyle: { color: "#f1f5f9", fontSize: 12 },
    },
  }

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        AI Job Market
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Summary stats */}
        <div className="flex flex-col gap-3">
          <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
              Total AI Postings
            </p>
            <p className="text-3xl font-bold text-violet-400">
              {data.totalAIJobs.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">active job listings across Canada</p>
          </div>

          {data.averageSalary && (
            <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
                Average Salary
              </p>
              <p className="text-3xl font-bold text-emerald-400">
                ${Math.round(data.averageSalary / 1000)}k
              </p>
              <p className="text-xs text-slate-500 mt-1">CAD per year</p>
            </div>
          )}

          {/* Search term breakdown */}
          {data.searchTerms.length > 0 && (
            <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
                By Search Term
              </p>
              <div className="space-y-1.5">
                {data.searchTerms.map((t) => (
                  <div key={t.term} className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">{t.term}</span>
                    <span className="text-xs text-slate-500">{t.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location chart */}
        {data.topLocations.length > 0 && (
          <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4 lg:col-span-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
              AI Job Postings by Location
            </p>
            <ReactECharts
              option={locationOption}
              style={{ height: 280 }}
              opts={{ renderer: "svg" }}
            />
          </div>
        )}
      </div>

      {/* Sample job listings */}
      {data.sampleJobs.length > 0 && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.sampleJobs.slice(0, 4).map((job, i) => (
            <a
              key={i}
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/60 rounded border border-slate-700/50 p-3 hover:bg-slate-700/30 transition-colors block"
            >
              <p className="text-sm font-medium text-slate-200 line-clamp-1">{job.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {job.company} — {job.location}
              </p>
              {job.salary && (
                <span className="text-[10px] text-emerald-400/80 mt-1 inline-block">
                  {job.salary}
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-2">
        Source: Adzuna — Canadian AI job market data
      </p>
    </section>
  )
}
