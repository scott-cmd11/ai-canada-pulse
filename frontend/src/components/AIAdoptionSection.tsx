"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { StatCanAdoptionData } from "@/lib/statcan-sdmx-client"
import { SectionSkeleton } from "@/components/Skeleton"
import SourceAttribution from "@/components/SourceAttribution"
import echarts from "@/lib/echarts-custom"

const ReactECharts = dynamic(() => import("echarts-for-react/lib/core"), { ssr: false })

export default function AIAdoptionSection() {
  const [data, setData] = useState<StatCanAdoptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/adoption")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
      })
      .catch((err) => console.warn("[AIAdoptionSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SectionSkeleton title="Official AI adoption" variant="chart" />
  if (!data) {
    return (
      <section>
        <div className="section-header">
          <h2>Official AI Adoption</h2>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Statistics Canada adoption tables are unavailable right now.
        </p>
      </section>
    )
  }

  const chartOption = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (params: Array<{ name: string; value: number }>) => {
        const point = params[0]
        return `${point.name}<br/><strong>${point.value}%</strong> of businesses`
      },
    },
    grid: { left: 4, right: 38, bottom: 8, top: 10, containLabel: true },
    xAxis: {
      type: "value" as const,
      max: 45,
      axisLabel: { formatter: "{value}%", fontSize: 11 },
    },
    yAxis: {
      type: "category" as const,
      data: [...data.industries].reverse().map((industry) => industry.industry),
      axisLabel: { fontSize: 11, width: 160, overflow: "truncate" as const },
    },
    series: [
      {
        name: "Actual AI use",
        type: "bar" as const,
        data: [...data.industries].reverse().map((industry) => industry.adoptionRate),
        barWidth: 16,
        itemStyle: {
          color: "var(--accent-primary)",
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right" as const,
          formatter: "{c}%",
          fontSize: 10,
          color: "var(--text-secondary)",
        },
      },
    ],
    animation: false,
  }

  const fetchedLabel = new Date(data.fetchedAt).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  const operationalTop = data.operationalChanges.slice(0, 4)
  const noChange = data.employmentImpact.find((metric) => metric.label.toLowerCase().includes("no employment change"))

  return (
    <section>
      <div className="section-header">
        <h2 className="flex items-baseline justify-between gap-3">
          <span>Official AI Adoption</span>
          <span className="flex flex-wrap justify-end gap-2">
            <span
              className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
              style={{
                color: "var(--accent-primary)",
                backgroundColor: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
                borderColor: "color-mix(in srgb, var(--accent-primary) 24%, transparent)",
              }}
            >
              Evidence: direct adoption rate
            </span>
            <span
              className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
              style={{
                color: data.isLive ? "#15803d" : "#b45309",
                backgroundColor: data.isLive ? "rgba(22, 163, 74, 0.08)" : "rgba(245, 158, 11, 0.10)",
                borderColor: data.isLive ? "rgba(22, 163, 74, 0.24)" : "rgba(245, 158, 11, 0.28)",
              }}
            >
              {data.isLive ? "Live StatCan" : "Fallback"}
            </span>
          </span>
        </h2>
      </div>

      <p className="mb-4 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Official Statistics Canada business survey tables are the only direct adoption-rate source in this section.
        Search trends, news volume, GitHub, and model releases remain proxy signals, not adoption rates.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="saas-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Actual use
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {data.actualNationalRate.value}%
          </p>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Businesses used AI to produce goods or deliver services in {data.surveyPeriod}.
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Source type: official survey
          </p>
        </div>
        <div className="saas-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Planned use
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {data.plannedNationalRate.value}%
          </p>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Businesses planned to use AI over the next 12 months in Q3 2025.
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Source type: planned-use survey
          </p>
        </div>
        <div className="saas-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Employment impact
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {noChange ? `${noChange.value}%` : "n/a"}
          </p>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Of planned AI users expected no change in total employment.
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Source type: expected impact survey
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="saas-card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Actual AI use by industry
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Table {data.industries[0]?.tableId}
            </span>
          </div>
          <ReactECharts
            echarts={echarts}
            option={chartOption}
            style={{ height: "360px", width: "100%" }}
          />
        </div>

        <div className="saas-card p-5">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Expected operational changes
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {operationalTop.map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span style={{ color: "var(--text-secondary)" }}>{metric.label}</span>
                  <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>{metric.value}%</strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-secondary)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(metric.value, 100)}%`,
                      background: "var(--accent-primary)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            These are expected changes among businesses planning to use AI, not economy-wide adoption rates.
          </p>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Fetched {fetchedLabel}. All figures link back to Statistics Canada tables and should be read with survey sampling
        quality notes from the source table.
      </p>

      <SourceAttribution sourceId="statcan-ai-adoption" lastUpdated={fetchedLabel} />
    </section>
  )
}
