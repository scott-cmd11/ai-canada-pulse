"use client"

import dynamic from "next/dynamic"
import { privateSectorAdoption, overallComparison } from "@/lib/adoption-data"
import { useChartTheme } from "@/hooks/useChartTheme"
import echarts from "@/lib/echarts-custom"

const ReactECharts = dynamic(() => import("echarts-for-react/lib/core"), { ssr: false })

export default function AdoptionComparison() {
  const ct = useChartTheme()

  const industryOption = {
    grid: { top: 12, right: 35, bottom: 12, left: 4, containLabel: true },
    xAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 11, color: ct.textMuted, formatter: "{value}%" },
      splitLine: { lineStyle: { color: ct.splitLine } },
      max: 40,
    },
    yAxis: {
      type: "category" as const,
      data: [...privateSectorAdoption].reverse().map((d) => d.sector),
      axisLabel: { fontSize: 12, fontWeight: 500, color: ct.textSecondary, width: 140, overflow: "truncate" as const },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar" as const,
        data: [...privateSectorAdoption].reverse().map((d) => d.percentage),
        barWidth: 16,
        itemStyle: {
          color: ct.accent,
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right" as const,
          formatter: "{c}%",
          fontSize: 11,
          fontWeight: 600,
          color: ct.textSecondary,
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
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0]
        return `${p.name}<br/><b style="color: ${ct.tooltipValue}; font-size: 14px;">${p.value}%</b> deployed`
      },
    },
    animation: false
  }

  return (
    <section>
      <div className="section-header">
        <h2>Adoption Penetration</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <div className="flex flex-col gap-6">
          <div className="saas-card p-6 flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Public Sector
            </p>
            <p className="text-2xl sm:text-4xl font-bold tracking-tight leading-none mb-2" style={{ color: 'var(--text-primary)' }}>
              {overallComparison.publicSector.adoptionRate}%
            </p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Agencies utilizing ≥1 system
            </p>
            <span className="text-[11px] uppercase tracking-wider font-semibold mt-4 block" style={{ color: 'var(--text-muted)' }}>
              Source: {overallComparison.publicSector.source}
            </span>
          </div>

          <div className="saas-card p-6 flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Private Sector
            </p>
            <p className="text-2xl sm:text-4xl font-bold tracking-tight leading-none mb-2" style={{ color: 'var(--text-primary)' }}>
              {overallComparison.privateSector.adoptionRate}%
            </p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              National enterprise average
            </p>
            <span className="text-[11px] uppercase tracking-wider font-semibold mt-4 block" style={{ color: 'var(--text-muted)' }}>
              Source: {overallComparison.privateSector.source}
            </span>
          </div>
        </div>

        <div className="saas-card p-6 lg:p-8 lg:col-span-2 flex flex-col border-t-4 border-t-indigo-700">
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Commercial Deployment by Sector
          </p>
          <div className="flex-1 min-h-[250px] w-full">
            <ReactECharts
              echarts={echarts}
              option={industryOption}
              style={{ height: '300px', width: '100%' }}
            />
          </div>
        </div>

      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>
        Source: Statistics Canada 11-621-M, Treasury Board of Canada
      </p>
    </section>
  )
}
