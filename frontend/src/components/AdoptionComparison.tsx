"use client"

import dynamic from "next/dynamic"
import { privateSectorAdoption, overallComparison } from "@/lib/adoption-data"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

export default function AdoptionComparison() {
  const industryOption = {
    grid: { top: 12, right: 35, bottom: 12, left: 4, containLabel: true },
    xAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 11, color: "#64748B", formatter: "{value}%" }, // slate-500
      splitLine: { lineStyle: { color: "#F1F5F9" } }, // slate-100
      max: 40,
    },
    yAxis: {
      type: "category" as const,
      data: [...privateSectorAdoption].reverse().map((d) => d.sector),
      axisLabel: { fontSize: 12, fontWeight: 500, color: "#334155", width: 140, overflow: "truncate" as const }, // slate-700
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar" as const,
        data: [...privateSectorAdoption].reverse().map((d) => d.percentage),
        barWidth: 16,
        itemStyle: {
          color: "#4338CA", // indigo-700
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right" as const,
          formatter: "{c}%",
          fontSize: 11,
          fontWeight: 600,
          color: "#475569", // slate-600
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
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0]
        return `${p.name}<br/><b style="color: #0F172A; font-size: 14px;">${p.value}%</b> deployed`
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
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Public Sector
            </p>
            <p className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-none mb-2">
              {overallComparison.publicSector.adoptionRate}%
            </p>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Agencies utilizing ≥1 system
            </p>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mt-4 block">
              Source: {overallComparison.publicSector.source}
            </span>
          </div>

          <div className="saas-card p-6 flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Private Sector
            </p>
            <p className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-none mb-2">
              {overallComparison.privateSector.adoptionRate}%
            </p>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              National enterprise average
            </p>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mt-4 block">
              Source: {overallComparison.privateSector.source}
            </span>
          </div>
        </div>

        <div className="saas-card p-6 lg:p-8 lg:col-span-2 flex flex-col border-t-4 border-t-indigo-700">
          <p className="text-sm font-bold text-slate-900 mb-4">
            Commercial Deployment by Sector
          </p>
          <div className="flex-1 min-h-[250px] w-full">
            <ReactECharts
              option={industryOption}
              style={{ height: '300px', width: '100%' }}
              opts={{ renderer: "svg" }}
            />
          </div>
        </div>

      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
        Source: Statistics Canada 11-621-M, Treasury Board of Canada
      </p>
    </section>
  )
}
