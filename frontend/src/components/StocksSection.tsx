"use client"

import { useState, useEffect } from "react"
import type { StocksData, StockQuote } from "@/lib/stocks-client"

export default function StocksSection() {
  const [data, setData] = useState<StocksData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/stocks")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
          Canadian AI Stocks
        </h2>
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Loading stock data...</p>
        </div>
      </section>
    )
  }

  if (!data || data.quotes.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
          Canadian AI Stocks
        </h2>
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Unable to load stock data at this time.</p>
        </div>
      </section>
    )
  }

  // Compute overall index performance
  const gainers = data.quotes.filter((q) => q.changePercent > 0).length
  const losers = data.quotes.filter((q) => q.changePercent < 0).length
  const avgChange =
    data.quotes.reduce((s, q) => s + q.changePercent, 0) / data.quotes.length

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Canadian AI Stocks
      </h2>

      {/* Overview */}
      <div className="bg-slate-800/60 rounded border border-slate-700/50 p-4 mb-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              AI Stock Index (Avg)
            </p>
            <p
              className={`text-2xl font-bold ${avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {avgChange >= 0 ? "+" : ""}
              {avgChange.toFixed(2)}%
            </p>
          </div>
          <div className="flex gap-4 ml-auto text-xs">
            <span className="text-emerald-400">
              {gainers} gaining
            </span>
            <span className="text-red-400">
              {losers} declining
            </span>
          </div>
        </div>
      </div>

      {/* Stock ticker grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {data.quotes.map((q) => (
          <StockCard key={q.symbol} quote={q} />
        ))}
      </div>

      <p className="text-[10px] text-slate-600 mt-2">
        Source: Yahoo Finance — TSX-listed Canadian AI companies.{" "}
        {data.fetchedAt && `Updated: ${new Date(data.fetchedAt).toLocaleTimeString()}`}
      </p>
    </section>
  )
}

function StockCard({ quote }: { quote: StockQuote }) {
  const isUp = quote.changePercent >= 0

  return (
    <div className="bg-slate-800/60 rounded border border-slate-700/50 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-slate-400">
          {quote.symbol.replace(".TO", "").replace(".V", "")}
        </span>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            isUp
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-red-400 bg-red-500/10"
          }`}
        >
          {isUp ? "+" : ""}
          {quote.changePercent}%
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-200">${quote.price.toFixed(2)}</p>
      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{quote.name}</p>
    </div>
  )
}
