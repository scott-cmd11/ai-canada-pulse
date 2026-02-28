"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { SentimentData } from "@/lib/gdelt-client"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

const SENTIMENT_CONFIG = {
  positive: { label: "Positive", color: "#10b981", bg: "bg-emerald-500/10" },
  neutral: { label: "Neutral", color: "#64748b", bg: "bg-slate-500/10" },
  negative: { label: "Negative", color: "#ef4444", bg: "bg-red-500/10" },
}

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
        <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
          Media Sentiment on AI
        </h2>
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Loading GDELT sentiment data...</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
          Media Sentiment on AI
        </h2>
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Unable to load media sentiment data at this time.</p>
        </div>
      </section>
    )
  }

  const { toneDistribution, averageTone, sentimentLabel } = data
  const total = toneDistribution.positive + toneDistribution.neutral + toneDistribution.negative
  const config = SENTIMENT_CONFIG[sentimentLabel]

  const pieOption = {
    series: [
      {
        type: "pie" as const,
        radius: ["55%", "78%"],
        center: ["50%", "50%"],
        data: [
          { value: toneDistribution.positive, name: "Positive", itemStyle: { color: "#10b981" } },
          { value: toneDistribution.neutral, name: "Neutral", itemStyle: { color: "#475569" } },
          { value: toneDistribution.negative, name: "Negative", itemStyle: { color: "#ef4444" } },
        ],
        label: {
          show: true,
          formatter: "{b}: {d}%",
          fontSize: 10,
          color: "#94a3b8",
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.3)" },
        },
      },
    ],
    tooltip: {
      trigger: "item" as const,
      backgroundColor: "#1e293b",
      borderColor: "#334155",
      textStyle: { color: "#f1f5f9", fontSize: 12 },
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}: ${p.value} articles (${p.percent}%)`,
    },
  }

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Media Sentiment on AI
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Overall sentiment card */}
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
            Overall Tone
          </p>
          <p className="text-3xl font-bold" style={{ color: config.color }}>
            {config.label}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Average tone score: {averageTone > 0 ? "+" : ""}
            {averageTone}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Based on {total} Canadian AI articles
          </p>

          {/* Tone bar */}
          <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-slate-700">
            {total > 0 && (
              <>
                <div
                  className="bg-emerald-500"
                  style={{ width: `${(toneDistribution.positive / total) * 100}%` }}
                />
                <div
                  className="bg-slate-500"
                  style={{ width: `${(toneDistribution.neutral / total) * 100}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(toneDistribution.negative / total) * 100}%` }}
                />
              </>
            )}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-slate-500">
            <span>{toneDistribution.positive} positive</span>
            <span>{toneDistribution.neutral} neutral</span>
            <span>{toneDistribution.negative} negative</span>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4 lg:col-span-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
            Sentiment Distribution
          </p>
          <ReactECharts option={pieOption} style={{ height: 220 }} opts={{ renderer: "svg" }} />
        </div>
      </div>

      {/* Top sources */}
      {data.topSources.length > 0 && (
        <div className="mt-3 bg-slate-800/60 rounded border border-slate-700/50 p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
            Top Canadian AI News Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {data.topSources.map((s) => (
              <span
                key={s.source}
                className="text-xs text-slate-300 bg-slate-700/50 px-2 py-1 rounded"
              >
                {s.source}{" "}
                <span className="text-slate-500">({s.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent articles */}
      {data.articles.length > 0 && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.articles.slice(0, 4).map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/60 rounded border border-slate-700/50 p-3 hover:bg-slate-700/30 transition-colors block"
            >
              <p className="text-sm font-medium text-slate-200 line-clamp-2">{a.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-slate-500">{a.domain}</span>
                <span className="text-[10px] text-slate-600">{a.seenDate}</span>
                <ToneBadge tone={a.tone} />
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-2">
        Source: GDELT Project — real-time global media monitoring and sentiment analysis
      </p>
    </section>
  )
}

function ToneBadge({ tone }: { tone: number }) {
  const label = tone > 1 ? "Positive" : tone < -1 ? "Negative" : "Neutral"
  const color =
    tone > 1
      ? "text-emerald-400 bg-emerald-500/10"
      : tone < -1
        ? "text-red-400 bg-red-500/10"
        : "text-slate-400 bg-slate-500/10"

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto ${color}`}>
      {label}
    </span>
  )
}
