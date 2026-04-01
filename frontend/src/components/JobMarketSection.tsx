"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { JobMarketData } from "@/lib/jobs-client"
import { useChartTheme } from "@/hooks/useChartTheme"
import SourceAttribution from '@/components/SourceAttribution'
import { SectionSkeleton } from '@/components/Skeleton'
import echarts from "@/lib/echarts-custom"
import SectionSummary from '@/components/SectionSummary'

const ReactECharts = dynamic(() => import("echarts-for-react/lib/core"), { ssr: false })

interface JobMarketSectionProps {
  region?: string
}

export default function JobMarketSection({ region }: JobMarketSectionProps = {}) {
  const [data, setData] = useState<JobMarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)
  const ct = useChartTheme()

  useEffect(() => {
    const url = region
      ? `/api/v1/jobs?region=${encodeURIComponent(region)}`
      : "/api/v1/jobs"
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
        setSummary(json.summary ?? null)
      })
      .catch((err) => console.warn("[JobMarketSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [region])

  if (loading) {
    return <SectionSkeleton title="Labour Demand" variant="chart" />
  }

  if (!data) {
    return (
      <section>
        <div className="section-header">
          <h2>Labour Demand</h2>
        </div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Labour data currently unavailable.
          </p>
        </div>
      </section>
    )
  }

  const isFallback = data.source === 'fallback' || !data.source

  const locationOption = {
    grid: { top: 12, right: 40, bottom: 12, left: 4, containLabel: true },
    xAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 11, color: ct.textMuted },
      splitLine: { lineStyle: { color: ct.splitLine } },
    },
    yAxis: {
      type: "category" as const,
      data: [...data.topLocations].reverse().map((d) => d.location),
      axisLabel: { fontSize: 11, fontWeight: 500, color: ct.textSecondary, width: 100, overflow: "break" as const },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar" as const,
        data: [...data.topLocations].reverse().map((d) => d.count),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: ct.accent },
              { offset: 1, color: ct.accentDim.startsWith("rgba") ? ct.accent : ct.accentDim },
            ],
          },
        },
        barWidth: "60%",
        label: {
          show: true,
          position: "right" as const,
          fontSize: 11,
          fontWeight: 600,
          color: ct.textMuted,
        },
      },
    ],
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const, shadowStyle: { color: ct.splitLine } },
      backgroundColor: ct.tooltipBg,
      borderColor: ct.tooltipBorder,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: ct.tooltipText, fontSize: 13 },
    },
    animation: false
  }

  return (
    <section>
      <div className="section-header flex items-center justify-between">
        <h2>Labour Demand</h2>
        {isFallback && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Estimates
          </span>
        )}
      </div>

      <SectionSummary summary={summary} />

      {/* KPI Row — stacks on narrow viewports */}
      <div className="saas-card mb-6 grid grid-cols-1 sm:grid-cols-2">
        <div className="p-5 flex flex-col justify-center border-b sm:border-b-0 sm:border-r" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            Active Postings
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
            {data.totalAIJobs.toLocaleString()}
          </p>
        </div>

        {data.averageSalary && (
          <div className="p-5 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Avg. Base Salary
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
              ${Math.round(data.averageSalary / 1000)}k <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>CAD</span>
            </p>
          </div>
        )}
      </div>

      {/* Main content — stacks on narrow viewports */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Role Cluster list */}
        <div className="saas-card p-5 lg:col-span-2 border-t-4 border-t-sky-700">
          <p className="text-sm font-bold pb-3 mb-4 border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>
            Demand by Role Cluster
          </p>
          <div className="space-y-3">
            {data.searchTerms.map((t) => (
              <div key={t.term} className="flex justify-between items-center gap-3 text-sm">
                <span className="font-medium min-w-0" style={{ color: 'var(--text-secondary)' }}>{t.term}</span>
                <span className="font-bold px-2.5 py-0.5 rounded border shrink-0 tabular-nums" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
                  {t.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Distribution chart */}
        <div className="saas-card p-5 lg:col-span-3 flex flex-col">
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Regional Distribution
          </p>
          <div className="flex-1 min-h-[250px] w-full">
            <ReactECharts
              echarts={echarts}
              option={locationOption}
              style={{ height: '280px', width: '100%' }}
            />
          </div>
        </div>
      </div>
      <SourceAttribution sourceId="jobs" />
    </section>
  )
}
