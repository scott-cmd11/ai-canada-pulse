"use client"

import { useEffect, useMemo, useState } from "react"
import type { Quote } from "@/lib/quotes/types"
import QuoteCard from "./QuoteCard"
import QuoteFilters, { DEFAULT_FILTERS, type QuoteFilterState } from "./QuoteFilters"

const PAGE_SIZE = 20

export default function QuotesArchive() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<QuoteFilterState>(DEFAULT_FILTERS)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  useEffect(() => {
    let cancelled = false
    fetch("/api/v1/quotes?limit=500")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        setQuotes(Array.isArray(json.data) ? json.data : [])
      })
      .catch((err) => console.warn("[QuotesArchive] fetch failed:", err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const q of quotes) {
      if (q.quote_date) set.add(Number(q.quote_date.slice(0, 4)))
    }
    return Array.from(set).sort((a, b) => b - a)
  }, [quotes])

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (filters.party !== "All" && q.party !== filters.party) return false
      if (filters.chamber !== "All" && q.chamber !== filters.chamber) return false
      if (filters.jurisdiction !== "All" && q.jurisdiction !== filters.jurisdiction) return false
      if (filters.year !== "All" && (!q.quote_date || !q.quote_date.startsWith(filters.year))) return false
      if (filters.q) {
        const needle = filters.q.toLowerCase()
        const hay = `${q.quote_text} ${q.speaker_name}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [quotes, filters])

  const visible = filtered.slice(0, displayCount)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
          {loading
            ? "Loading archive…"
            : filtered.length === quotes.length
              ? `${quotes.length} quotes`
              : `${filtered.length} of ${quotes.length} quotes`}
        </p>
      </div>

      <QuoteFilters
        filters={filters}
        years={years}
        onChange={(next) => {
          setFilters(next)
          setDisplayCount(PAGE_SIZE)
        }}
        onReset={() => {
          setFilters(DEFAULT_FILTERS)
          setDisplayCount(PAGE_SIZE)
        }}
      />

      <div className="flex flex-col gap-4">
        {visible.map((q) => (
          <QuoteCard key={q.id} quote={q} />
        ))}
      </div>

      {!loading && filtered.length === 0 && quotes.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            No quotes match the current filters.
          </p>
        </div>
      )}

      {!loading && quotes.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            The archive is warming up. Check back shortly.
          </p>
        </div>
      )}

      {visible.length < filtered.length && (
        <button
          type="button"
          onClick={() => setDisplayCount((n) => n + PAGE_SIZE)}
          className="mx-auto min-h-[40px] rounded-full border px-4 text-xs font-semibold uppercase tracking-wider transition-colors"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--surface-primary)",
            color: "var(--text-primary)",
          }}
        >
          Show more ({filtered.length - visible.length} remaining)
        </button>
      )}
    </div>
  )
}
