"use client"

import dynamic from "next/dynamic"
import { privateSectorAdoption, overallComparison } from "@/lib/adoption-data"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

export default function AdoptionComparison() {
  // Horizontal bar chart: private sector by industry
  const industryOption = {
    grid: { top: 8, right: 55, bottom: 8, left: 4, containLabel: true },
    xAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 10, color: "#64748b", formatter: "{value}%" },
      splitLine: { lineStyle: { color: "#334155" } },
      max: 40,
    },
    yAxis: {
      type: "category" as const,
      data: [...privateSectorAdoption].reverse().map((d) => d.sector),
      axisLabel: { fontSize: 10, color: "#94a3b8", width: 180, overflow: "truncate" as const },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar" as const,
        data: [...privateSectorAdoption].reverse().map((d) => d.percentage),
        barWidth: 14,
        itemStyle: { color: "#3b82f6", borderRadius: [0, 2, 2, 0] },
        label: {
          show: true,
          position: "right" as const,
          formatter: "{c}%",
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
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0]
        return `${p.name}<br/><b>${p.value}%</b> of businesses using AI`
      },
    },
  }

  const privatePeriod = overallComparison.privateSector.quarter
    ? `${overallComparison.privateSector.quarter} ${overallComparison.privateSector.year}`
    : `${overallComparison.privateSector.year}`

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        AI Adoption in Canada
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Overall comparison cards */}
        <div className="flex flex-col gap-3">
          {/* Public sector */}
          <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4 flex-1">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
              Public Sector
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              {overallComparison.publicSector.adoptionRate}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              of federal departments have deployed at least one AI system
            </p>
            <p className="text-[10px] text-slate-600 mt-3">
              Source: {overallComparison.publicSector.source} ({overallComparison.publicSector.year})
            </p>
          </div>

          {/* Private sector overall */}
          <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4 flex-1">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
              Private Sector (Overall)
            </p>
            <p className="text-3xl font-bold text-blue-400">
              {overallComparison.privateSector.adoptionRate}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              of Canadian businesses are using AI across all industries
            </p>
            {overallComparison.privateSector.note && (
              <p className="text-[10px] text-amber-500/70 mt-2">
                {overallComparison.privateSector.note}
              </p>
            )}
            <p className="text-[10px] text-slate-600 mt-2">
              Source: {overallComparison.privateSector.source} (as of {privatePeriod})
            </p>
          </div>
        </div>

        {/* Industry breakdown chart */}
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4 lg:col-span-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
            Private Sector AI Adoption by Industry
          </p>
          <ReactECharts
            option={industryOption}
            style={{ height: 280 }}
            opts={{ renderer: "svg" }}
          />
          <p className="text-[10px] text-slate-600 mt-1">
            Source: Statistics Canada, 11-621-m (as of {privatePeriod})
          </p>
        </div>
      </div>
    </section>
  )
}
