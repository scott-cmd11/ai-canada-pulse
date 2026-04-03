"use client"

import { useCallback } from "react"
import type { SentimentData } from "@/lib/gdelt-client"
import { usePolling } from "@/hooks/usePolling"

interface SentimentSectionProps {
  region?: string
}

const TONE_CONFIG = {
  positive: { label: "Favorable", barColor: "#16a34a", textColor: "#15803d" },
  neutral:  { label: "Neutral",   barColor: "#94a3b8", textColor: "#64748b" },
  negative: { label: "Critical",  barColor: "#dc2626", textColor: "#b91c1c" },
} as const

export default function SentimentSection({ region }: SentimentSectionProps = {}) {
  const transform = useCallback((json: Record<string, unknown>) => {
    return (json.data as SentimentData) || null
  }, [])

  const url = region
    ? `/api/v1/sentiment?region=${encodeURIComponent(region)}`
    : "/api/v1/sentiment"

  const { data, loading } = usePolling<SentimentData>(url, {
    intervalMs: 300_000,
    transform,
  })

  if (loading) {
    return (
      <div className="saas-card p-4 animate-pulse" style={{ minHeight: 72 }}>
        <div className="h-3 w-32 rounded mb-3" style={{ background: 'var(--border-subtle)' }} />
        <div className="h-2 w-full rounded" style={{ background: 'var(--border-subtle)' }} />
      </div>
    )
  }

  if (!data) return null

  const { toneDistribution, sentimentLabel, total, scannedAt, topSources } = data
  const dist = toneDistribution
  const sum = dist.positive + dist.neutral + dist.negative || 1

  const pctFav  = Math.round((dist.positive / sum) * 100)
  const pctNeut = Math.round((dist.neutral  / sum) * 100)
  const pctCrit = 100 - pctFav - pctNeut

  const tone = TONE_CONFIG[sentimentLabel] ?? TONE_CONFIG.neutral

  const scannedDate = scannedAt
    ? new Date(scannedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })
    : null

  return (
    <div className="saas-card p-4 sm:p-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Media Sentiment
          </span>
          <span
            className="text-sm font-bold px-2.5 py-0.5 rounded-full"
            style={{
              color: tone.textColor,
              background: `color-mix(in srgb, ${tone.barColor} 10%, var(--surface-primary))`,
              border: `1px solid color-mix(in srgb, ${tone.barColor} 20%, var(--surface-primary))`,
            }}
          >
            {tone.label}
          </span>
        </div>
        {scannedDate && (
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {total.toLocaleString()} signals · {scannedDate}
          </span>
        )}
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 w-full rounded overflow-hidden mb-2" style={{ background: 'var(--border-subtle)' }}>
        <div style={{ width: `${pctFav}%`,  background: TONE_CONFIG.positive.barColor }} />
        <div style={{ width: `${pctNeut}%`, background: TONE_CONFIG.neutral.barColor,  opacity: 0.5 }} />
        <div style={{ width: `${pctCrit}%`, background: TONE_CONFIG.negative.barColor }} />
      </div>

      {/* Breakdown labels — aligned to bar segments */}
      <div className="relative mb-3 text-[11px] font-semibold" style={{ height: '1.2em' }}>
        <span style={{ color: TONE_CONFIG.positive.textColor, position: 'absolute', left: 0 }}>{pctFav}% Favorable</span>
        <span style={{ color: TONE_CONFIG.neutral.textColor,  position: 'absolute', left: `${pctFav}%` }}>{pctNeut}% Neutral</span>
        <span style={{ color: TONE_CONFIG.negative.textColor, position: 'absolute', right: 0 }}>{pctCrit}% Critical</span>
      </div>

      {/* Methodology note */}
      <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
        Each signal is classified as Favorable, Neutral, or Critical using keyword and tone analysis
        across Canadian AI news RSS feeds. The aggregate reflects the prevailing editorial tone at the time of scan.
      </p>

      {/* Sources */}
      {topSources.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span className="font-semibold uppercase tracking-wider">Sources:</span>
          {topSources.slice(0, 6).map((s) => (
            <span key={s.source}>{s.source} <span style={{ color: 'var(--border-subtle)' }}>({s.count})</span></span>
          ))}
        </div>
      )}
    </div>
  )
}
