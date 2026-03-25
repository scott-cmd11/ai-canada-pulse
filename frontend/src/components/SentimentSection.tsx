"use client"

import { useCallback } from "react"
import dynamic from "next/dynamic"
import type { SentimentData } from "@/lib/gdelt-client"
import { usePolling } from "@/hooks/usePolling"
import { useChartTheme } from "@/hooks/useChartTheme"
import echarts from "@/lib/echarts-custom"

const ReactECharts = dynamic(() => import("echarts-for-react/lib/core"), { ssr: false })

export default function SentimentSection() {
  const transform = useCallback((json: Record<string, unknown>) => {
    return (json.data as SentimentData) || null
  }, [])

  const { data, loading } = usePolling<SentimentData>("/api/v1/sentiment", {
    intervalMs: 300_000, // 5 minutes
    transform,
  })
  const ct = useChartTheme()

  if (loading) {
    return (
      <section>
        <div className="section-header">
          <h2>Media Sentiment Analysis</h2>
        </div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium text-slate-500">Loading sentiment data...</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <div className="section-header">
          <h2>Media Sentiment Analysis</h2>
        </div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium text-slate-500">Sentiment data currently unavailable.</p>
        </div>
      </section>
    )
  }

  const { toneDistribution, averageTone, sentimentLabel } = data
  const total = toneDistribution.positive + toneDistribution.neutral + toneDistribution.negative

  // Executive SaaS labels
  const labelMap = {
    positive: "Favorable",
    neutral: "Neutral",
    negative: "Critical"
  }

  const colorMap = {
    positive: "text-green-600",
    neutral: "text-slate-500",
    negative: "text-red-600"
  }

  const sentimentExecutiveLabel = labelMap[sentimentLabel as keyof typeof labelMap] || "Neutral"
  const sentimentColorClass = colorMap[sentimentLabel as keyof typeof colorMap] || colorMap.neutral

  const pieOption: Record<string, unknown> = {
    aria: {
      enabled: true,
      decal: { show: true },
      label: { description: "Pie chart showing media sentiment distribution across favorable, neutral, and critical coverage of Canadian AI news." },
    },
    series: [
      {
        type: "pie" as const,
        radius: ["60%", "80%"],
        center: ["50%", "50%"],
        data: [
          { value: toneDistribution.positive, name: "Favorable", itemStyle: { color: ct.positive } },
          { value: toneDistribution.neutral, name: "Neutral", itemStyle: { color: ct.neutral } },
          { value: toneDistribution.negative, name: "Critical", itemStyle: { color: ct.negative } },
        ],
        label: {
          show: true,
          formatter: "{b}\n{d}%",
          fontSize: 12,
          fontWeight: 600,
          color: ct.textSecondary,
          lineHeight: 16
        },
        labelLine: {
          lineStyle: { color: ct.axisLine }
        }
      },
    ],
    tooltip: {
      trigger: "item" as const,
      backgroundColor: ct.tooltipBg,
      borderColor: ct.tooltipBorder,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: ct.tooltipText, fontSize: 13 },
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}<br/><b style="color: ${ct.tooltipValue}; font-size: 14px;">${p.value} volume</b>`,
    },
    animation: false
  }

  return (
    <section>
      <div className="section-header">
        <h2>Media Sentiment Analysis</h2>
      </div>
      <p className="text-sm text-slate-600 mb-3 max-w-3xl leading-relaxed">
        Measures the tone of Canadian AI news coverage by analyzing recent articles from RSS feeds. Each story is scored as Favorable, Neutral, or Critical. The aggregate tone indicates whether public discourse is optimistic (signaling confidence and investment momentum) or critical (highlighting concerns around regulation, job displacement, or ethics).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="saas-card p-6 md:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-2">
              Aggregate Tone
            </p>
            <p className={`text-2xl sm:text-3xl font-bold tracking-tight leading-none mb-3 ${sentimentColorClass}`}>
              {sentimentExecutiveLabel}
            </p>
            <p className="text-sm font-medium text-slate-700 bg-slate-100 inline-block px-2.5 py-1 rounded">
              Index: {averageTone > 0 ? "+" : ""}{averageTone}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex h-3 w-full rounded overflow-hidden bg-slate-100">
              {total > 0 && (
                <>
                  <div style={{ background: ct.positive, width: `${(toneDistribution.positive / total) * 100}%` }} />
                  <div style={{ background: ct.neutral, width: `${(toneDistribution.neutral / total) * 100}%` }} />
                  <div style={{ background: ct.negative, width: `${(toneDistribution.negative / total) * 100}%` }} />
                </>
              )}
            </div>
            <div className="flex justify-between mt-3 text-xs font-bold text-slate-500">
              <span className="text-green-700">{Math.round((toneDistribution.positive / total) * 100)}% Fav</span>
              <span className="text-red-700">{Math.round((toneDistribution.negative / total) * 100)}% Crit</span>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-4">
              N = {total} publications (Canada locale)
            </p>
          </div>
        </div>

        <div className="saas-card p-6 md:p-8 lg:col-span-2 flex flex-col min-h-[300px]">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-2">
            Distribution
          </p>
          <div className="flex-1 w-full min-h-[250px]">
            <ReactECharts echarts={echarts} option={pieOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="mt-6 saas-card bg-slate-50">
        <div className="px-5 py-3 border-b border-slate-200">
          <p className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[11px]">
            Key Broadcasters
          </p>
        </div>
        <div className="px-5 py-4 text-sm font-medium text-slate-600 leading-wider flex flex-wrap gap-x-4 gap-y-2">
          {data.topSources.map((s, i) => (
            <div key={s.source} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full">
              <span className="text-slate-900 font-bold text-xs">{s.source}</span>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-sm">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
