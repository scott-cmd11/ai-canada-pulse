"use client"

import { useState, useEffect } from "react"
import type { StocksData, StockQuote } from "@/lib/stocks-client"
import SourceAttribution from '@/components/SourceAttribution'
import { SectionSkeleton } from '@/components/Skeleton'
import SectionSummary from '@/components/SectionSummary'

interface StocksSectionProps {
  region?: string
}

export default function StocksSection({ region }: StocksSectionProps = {}) {
  const [data, setData] = useState<StocksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)

  useEffect(() => {
    const url = region
      ? `/api/v1/stocks?region=${encodeURIComponent(region)}`
      : "/api/v1/stocks"
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
        setSummary(json.summary ?? null)
      })
      .catch((err) => console.warn("[StocksSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [region])

  if (loading) {
    return <SectionSkeleton title="Market Performance" variant="table" />
  }

  if (!data || data.quotes.length === 0) {
    return (
      <section>
        <div className="section-header">
          <h2>Market Performance</h2>
        </div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Market data feed currently unavailable.</p>
        </div>
      </section>
    )
  }

  const gainers = data.quotes.filter((q) => q.changePercent > 0).length
  const losers = data.quotes.filter((q) => q.changePercent < 0).length
  const avgChange =
    data.quotes.reduce((s, q) => s + q.changePercent, 0) / data.quotes.length

  return (
    <section>
      <div className="section-header">
        <h2 className="flex flex-wrap items-center justify-between gap-2">
          <span>Market Performance</span>
          {data.fetchedAt && (
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-secondary)' }}>
              As of {new Date(data.fetchedAt).toLocaleTimeString()}
            </span>
          )}
        </h2>
      </div>

      <SectionSummary summary={summary} />

      <div className="saas-card mb-4 flex flex-col md:flex-row">
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            AI Index Average
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </p>
            <span className={`text-sm font-bold ${avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {avgChange >= 0 ? "▲" : "▼"}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center gap-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span style={{ color: 'var(--text-secondary)' }}>Advancing Issues</span>
            <span className="text-green-600 font-bold bg-green-50 px-2 rounded-full">{gainers}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium">
            <span style={{ color: 'var(--text-secondary)' }}>Declining Issues</span>
            <span className="text-red-600 font-bold bg-red-50 px-2 rounded-full">{losers}</span>
          </div>
        </div>
      </div>

      <div className="saas-card overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead className="border-b" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
            <tr>
              <th className="py-3 px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Ticker</th>
              <th className="py-3 px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Company</th>
              <th className="py-3 px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase text-right" style={{ color: 'var(--text-muted)' }}>Price</th>
              <th className="py-3 px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase text-right" style={{ color: 'var(--text-muted)' }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {data.quotes.map((q) => (
              <StockRow key={q.symbol} quote={q} />
            ))}
          </tbody>
        </table>
      </div>
      <SourceAttribution sourceId="stocks" />
    </section>
  )
}

function StockRow({ quote }: { quote: StockQuote }) {
  const isUp = quote.changePercent >= 0
  const colorClass = isUp ? "text-green-600" : "text-red-600"

  return (
    <tr className="transition-colors border-b last:border-b-0" style={{ borderColor: 'var(--border-subtle)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-secondary)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    >
      <td className="py-3 px-4 sm:px-5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        {quote.symbol.replace(".TO", "").replace(".V", "")}
      </td>
      <td className="py-3 px-4 sm:px-5 text-sm font-medium whitespace-normal" style={{ color: 'var(--text-secondary)' }}>
        {quote.name}
      </td>
      <td className="py-3 px-4 sm:px-5 text-sm font-bold text-right w-[100px]" style={{ color: 'var(--text-primary)' }}>
        ${quote.price.toFixed(2)}
      </td>
      <td className={`py-3 px-4 sm:px-5 text-sm font-bold text-right w-[100px] ${colorClass}`}>
        {isUp ? "+" : ""}{quote.changePercent}%
      </td>
    </tr>
  )
}
