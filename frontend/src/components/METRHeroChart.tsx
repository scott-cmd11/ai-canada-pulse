"use client"

import { useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { usePolling } from "@/hooks/usePolling"
import type { METRModel, METRStats } from "@/lib/epoch-client"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

interface METRData {
  models: METRModel[]
  stats: METRStats
}

const SOTA_COLOR = "#4ADE80"
const NON_SOTA_COLOR = "rgba(148, 163, 184, 0.48)"
const TREND_COLOR = "rgba(134, 239, 172, 0.78)"

function formatHours(hours: number): string {
  if (hours < 1 / 60) return `${(hours * 3600).toFixed(0)}s`
  if (hours < 0.75) return `${(hours * 60).toFixed(0)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)} days`
}

function formatDoublingTime(days: number): string {
  return `~${Math.max(1, Math.round(days / 30))} mo`
}

function toDecimalYear(dateStr: string): number | null {
  const d = new Date(dateStr + "T00:00:00")
  if (Number.isNaN(d.getTime())) return null
  const year = d.getFullYear()
  if (year < 2018 || year > 2030) return null
  const startOfYear = new Date(year, 0, 1).getTime()
  const endOfYear = new Date(year + 1, 0, 1).getTime()
  return year + (d.getTime() - startOfYear) / (endOfYear - startOfYear)
}

function buildLabelSet(models: METRModel[]): Set<string> {
  const byDate = [...models].sort((a, b) => toDecimalYear(a.releaseDate)! - toDecimalYear(b.releaseDate)!)
  const byHorizon = [...models].sort((a, b) => b.p50Hours - a.p50Hours)
  const latestSota = byDate.filter((model) => model.isSota).slice(-4)
  const highest = byHorizon.slice(0, 2)
  const landmarks = ["GPT-5", "GPT-5.2", "Claude Opus 4.5", "Claude Opus 4.6"]

  return new Set([
    ...latestSota.map((model) => model.name),
    ...highest.map((model) => model.name),
    ...landmarks,
  ])
}

export default function METRHeroChart() {
  const transform = useCallback((json: Record<string, unknown>) => {
    const models = json.models as METRModel[] | undefined
    const stats = json.stats as METRStats | undefined
    if (!models || !stats || models.length === 0) return null
    return { models, stats } as METRData
  }, [])

  const { data, loading } = usePolling<METRData>("/api/v1/epoch-models", {
    intervalMs: 1_800_000,
    transform,
  })

  const chartOption = useMemo(() => {
    if (!data) return null

    const validModels = data.models
      .filter((model) => toDecimalYear(model.releaseDate) !== null)
      .filter((model) => model.p50Hours > 0)

    if (validModels.length === 0) return null

    const maxP50 = Math.max(...validModels.map((model) => model.p50Hours))
    const yMax = Math.ceil(maxP50 + 1)
    const sotaModels = validModels.filter((model) => model.isSota)
    const nonSotaModels = validModels.filter((model) => !model.isSota)
    const labelSet = buildLabelSet(validModels)

    const makeScatterData = (models: METRModel[], color: string, borderColor: string) =>
      models.map((model) => ({
        value: [toDecimalYear(model.releaseDate)!, model.p50Hours],
        model,
        itemStyle: {
          color,
          borderColor,
          borderWidth: 1,
        },
      }))

    const trendLineData: Array<[number, number]> = []
    const sotaSorted = [...sotaModels].sort(
      (a, b) => toDecimalYear(a.releaseDate)! - toDecimalYear(b.releaseDate)!
    )

    if (sotaSorted.length >= 2) {
      const first = sotaSorted[0]
      const last = sotaSorted[sotaSorted.length - 1]
      const x0 = toDecimalYear(first.releaseDate)!
      const x1 = toDecimalYear(last.releaseDate)!
      const y0 = Math.max(first.p50Hours, 0.01)
      const y1 = Math.max(last.p50Hours, 0.01)
      const k = Math.log(y1 / y0) / Math.max(x1 - x0, 0.01)

      for (let x = 2024; x <= 2026.5; x += 0.04) {
        const y = y0 * Math.exp(k * (x - x0))
        if (y <= yMax * 1.15) trendLineData.push([x, y])
      }
    }

    const errorBarSeries = validModels.map((model) => {
      const x = toDecimalYear(model.releaseDate)!
      return {
        type: "line" as const,
        data: [[x, model.p50CILow], [x, model.p50CIHigh]] as Array<[number, number]>,
        symbol: "none",
        lineStyle: {
          color: model.isSota ? "rgba(74, 222, 128, 0.34)" : "rgba(148, 163, 184, 0.16)",
          width: model.isSota ? 1.25 : 1,
        },
        silent: true,
        z: 1,
      }
    })

    return {
      animation: false,
      grid: {
        left: 40,
        right: 12,
        top: 18,
        bottom: 26,
      },
      xAxis: {
        type: "value" as const,
        min: 2024,
        max: 2026.5,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(226,232,240,0.46)",
          fontSize: 10,
          formatter: (value: number) => Math.floor(value).toString(),
        },
        splitLine: {
          lineStyle: { color: "rgba(255,255,255,0.04)" },
        },
      },
      yAxis: {
        type: "value" as const,
        min: 0,
        max: yMax,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(226,232,240,0.46)",
          fontSize: 10,
          formatter: (value: number) => {
            if (value === 0) return "0"
            if (value < 1) return `${Math.round(value * 60)}m`
            return `${value}h`
          },
        },
        splitLine: {
          lineStyle: { color: "rgba(255,255,255,0.06)", type: "dashed" as const },
        },
      },
      tooltip: {
        trigger: "item" as const,
        backgroundColor: "rgba(15,23,42,0.96)",
        borderColor: "rgba(99,102,241,0.28)",
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: "#E2E8F0", fontSize: 11 },
        formatter: (params: { data: { model?: METRModel } }) => {
          const model = params.data?.model
          if (!model) return ""
          return [
            `<b style="color:#fff">${model.name}</b>`,
            `<span style="color:#94A3B8">${model.releaseDate}</span>`,
            `<b>50% horizon:</b> ${formatHours(model.p50Hours)}`,
            `<b>80% horizon:</b> ${formatHours(model.p80Hours)}`,
            model.isSota ? `<span style="color:#4ADE80">SOTA frontier model</span>` : "",
          ].filter(Boolean).join("<br/>")
        },
      },
      series: [
        ...errorBarSeries,
        {
          type: "line" as const,
          data: trendLineData,
          symbol: "none",
          smooth: true,
          silent: true,
          z: 2,
          lineStyle: {
            color: TREND_COLOR,
            width: 2.5,
            opacity: 0.95,
          },
          areaStyle: {
            color: "rgba(74, 222, 128, 0.08)",
          },
        },
        {
          type: "scatter" as const,
          data: makeScatterData(nonSotaModels, NON_SOTA_COLOR, "rgba(255,255,255,0.06)"),
          symbolSize: 7,
          z: 3,
          label: { show: false },
        },
        {
          type: "scatter" as const,
          data: makeScatterData(sotaModels, SOTA_COLOR, "rgba(255,255,255,0.22)"),
          symbolSize: 10,
          z: 4,
          label: {
            show: true,
            formatter: (params: { data: { model: METRModel } }) =>
              labelSet.has(params.data.model.name) ? params.data.model.name : "",
            position: "right" as const,
            distance: 6,
            fontSize: 9,
            fontWeight: 600,
            color: "rgba(255,255,255,0.72)",
          },
        },
      ] as any[],
    }
  }, [data])

  if (loading || !data) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center">
        <div className="text-xs text-indigo-200/55 animate-pulse">Loading METR benchmark...</div>
      </div>
    )
  }

  const { stats } = data

  return (
    <div className="flex h-full min-h-[320px] flex-col gap-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
              Frontier capability pace
            </p>
            <h3 className="max-w-sm text-lg font-semibold leading-tight text-white">
              Time horizons are stretching fast enough to move from minutes to multi-hour tasks.
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-indigo-100/70">
              METR&apos;s benchmark shows the recent frontier curve steepening, which is why the dashboard treats capability growth as a live Canada-relevant signal.
            </p>
          </div>

          <a
            href="https://metr.org/time-horizons/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200/65 transition-colors hover:border-white/20 hover:text-white"
          >
            Source: METR
          </a>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <MetricCard label="Highest horizon" value={formatHours(stats.highestP50Hours)} note="50% success threshold" />
          <MetricCard label="Doubling pace" value={formatDoublingTime(stats.doublingTimeDays)} note="Capability trend" />
          <MetricCard
            label="Latest frontier point"
            value={stats.latestModel?.name ?? "-"}
            note={stats.latestModel ? formatHours(stats.latestModel.p50Hours) : "Awaiting data"}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 rounded-2xl border border-white/8 bg-slate-950/20 p-2 sm:p-3">
        {chartOption && (
          <ReactECharts
            option={chartOption}
            style={{ height: "260px", width: "100%" }}
            opts={{ renderer: "svg" }}
          />
        )}
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-indigo-100/52">
        Recent frontier models are the focus here. The hero emphasizes the acceleration curve, while the full methodology documents the underlying benchmark source and cadence.
      </p>
    </div>
  )
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 px-3.5 py-3 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-100/45">{label}</p>
      <p className="mt-1.5 text-base font-semibold leading-tight text-white">{value}</p>
      <p className="mt-1 text-[11px] text-indigo-100/50">{note}</p>
    </div>
  )
}
