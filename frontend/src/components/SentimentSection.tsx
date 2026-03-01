"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { SentimentData } from "@/lib/gdelt-client"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

export default function SentimentSection() {
  const [data, setData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/sentiment", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
      })
      .catch((err) => console.warn("[SentimentSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section>
        <div className="section-header">
          <h2>Media Sentiment Analysis</h2>
        </div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium text-slate-500">Analyzing global broadcast data...</p>
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
          <p className="text-sm font-medium text-slate-500">Insufficient sentiment data to build model.</p>
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

  const hexMap = {
    positive: "#16A34A",
    neutral: "#94A3B8",
    negative: "#DC2626"
  }

  const sentimentExecutiveLabel = labelMap[sentimentLabel as keyof typeof labelMap] || "Neutral"
  const sentimentColorClass = colorMap[sentimentLabel as keyof typeof colorMap] || colorMap.neutral

  const pieOption = {
    series: [
      {
        type: "pie" as const,
        radius: ["60%", "80%"],
        center: ["50%", "50%"],
        data: [
          { value: toneDistribution.positive, name: "Favorable", itemStyle: { color: hexMap.positive } },
          { value: toneDistribution.neutral, name: "Neutral", itemStyle: { color: hexMap.neutral } },
          { value: toneDistribution.negative, name: "Critical", itemStyle: { color: hexMap.negative } },
        ],
        label: {
          show: true,
          formatter: "{b}\n{d}%",
          fontSize: 12,
          fontWeight: 600,
          color: "#475569", // slate-600
          lineHeight: 16
        },
        labelLine: {
          lineStyle: { color: "#CBD5E1" } // slate-300
        }
      },
    ],
    tooltip: {
      trigger: "item" as const,
      backgroundColor: "#FFFFFF",
      borderColor: "#E2E8F0",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#334155", fontSize: 13 },
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}<br/><b style="color: #0F172A; font-size: 14px;">${p.value} volume</b>`,
    },
    animation: false
  }

  return (
    <section>
      <div className="section-header">
        <h2>Media Sentiment Analysis</h2>
      </div>

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
                  <div style={{ background: hexMap.positive, width: `${(toneDistribution.positive / total) * 100}%` }} />
                  <div style={{ background: hexMap.neutral, width: `${(toneDistribution.neutral / total) * 100}%` }} />
                  <div style={{ background: hexMap.negative, width: `${(toneDistribution.negative / total) * 100}%` }} />
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
            <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: "svg" }} />
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
