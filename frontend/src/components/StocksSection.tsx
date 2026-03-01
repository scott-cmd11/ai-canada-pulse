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
      .catch((err) => console.warn("[StocksSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section>
        <div className="section-header">
          <h2>Market Performance</h2>
        </div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium text-slate-500">Retrieving TSX market data...</p>
        </div>
      </section>
    )
  }

  if (!data || data.quotes.length === 0) {
    return (
      <section>
        <div className="section-header">
          <h2>Market Performance</h2>
        </div>
        <div className="saas-card p-6">
          <p className="text-sm font-medium text-slate-500">Market data feed currently unavailable.</p>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              As of {new Date(data.fetchedAt).toLocaleTimeString()}
            </span>
          )}
        </h2>
      </div>

      <div className="saas-card mb-4 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            AI Index Average
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </p>
            <span className={`text-sm font-bold ${avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {avgChange >= 0 ? "▲" : "▼"}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center gap-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-slate-600">Advancing Issues</span>
            <span className="text-green-600 font-bold bg-green-50 px-2 rounded-full">{gainers}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-slate-600">Declining Issues</span>
            <span className="text-red-600 font-bold bg-red-50 px-2 rounded-full">{losers}</span>
          </div>
        </div>
      </div>

      <div className="saas-card overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase text-slate-500">Ticker</th>
              <th className="py-3 px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase text-slate-500">Company</th>
              <th className="py-3 px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase text-slate-500 text-right">Price</th>
              <th className="py-3 px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase text-slate-500 text-right">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.quotes.map((q) => (
              <StockRow key={q.symbol} quote={q} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
        Source: Yahoo Finance · Updated every 30 min
      </p>
    </section>
  )
}

function StockRow({ quote }: { quote: StockQuote }) {
  const isUp = quote.changePercent >= 0
  const colorClass = isUp ? "text-green-600" : "text-red-600"

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4 sm:px-5 text-sm font-bold text-slate-900">
        {quote.symbol.replace(".TO", "").replace(".V", "")}
      </td>
      <td className="py-3 px-4 sm:px-5 text-sm font-medium text-slate-600 whitespace-normal">
        {quote.name}
      </td>
      <td className="py-3 px-4 sm:px-5 text-sm font-bold text-slate-900 text-right w-[100px]">
        ${quote.price.toFixed(2)}
      </td>
      <td className={`py-3 px-4 sm:px-5 text-sm font-bold text-right w-[100px] ${colorClass}`}>
        {isUp ? "+" : ""}{quote.changePercent}%
      </td>
    </tr>
  )
}
