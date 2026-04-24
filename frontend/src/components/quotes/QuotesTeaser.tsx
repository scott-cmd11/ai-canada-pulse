"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Quote } from "@/lib/quotes/types"
import { PARTY_STYLES, DEFAULT_PARTY_STYLE } from "@/lib/party-styles"

export default function QuotesTeaser() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/v1/quotes?limit=12")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        const all: Quote[] = Array.isArray(json.data) ? json.data : []
        const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000
        const fresh = all.filter((q) => {
          if (!q.quote_date) return false
          const t = Date.parse(q.quote_date)
          return Number.isFinite(t) && t >= cutoff
        })
        setQuotes(fresh.slice(0, 3))
      })
      .catch((err) => console.warn("[QuotesTeaser] fetch failed:", err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const count = quotes?.length ?? 0
  const gridCols =
    count >= 3 ? "md:grid-cols-3" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-1"

  return (
    <div className="saas-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--text-muted)" }}
        >
          Quotes Archive
        </span>
        <Link
          href="/quotes"
          className="text-[11px] font-bold uppercase tracking-wider hover:underline"
          style={{ color: "var(--accent-primary)" }}
        >
          See the full archive &rarr;
        </Link>
      </div>

      {loading && (
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Loading quotes archive…
        </p>
      )}

      {!loading && count === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          The quotes archive is warming up.
        </p>
      )}

      {!loading && count > 0 && (
        <div className={`grid grid-cols-1 ${gridCols} gap-3`}>
          {quotes!.map((q) => {
            const partyStyle = PARTY_STYLES[q.party ?? ""] ?? DEFAULT_PARTY_STYLE
            return (
              <div
                key={q.id}
                className="rounded-lg p-3 flex flex-col gap-2"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    {q.speaker_name}
                  </span>
                  {q.party && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded" style={partyStyle}>
                      {q.party}
                    </span>
                  )}
                </div>
                <p
                  className="text-sm leading-snug line-clamp-4"
                  style={{ color: "var(--text-secondary)", fontStyle: "italic" }}
                >
                  &ldquo;{q.quote_text.slice(0, 200)}{q.quote_text.length > 200 ? "…" : ""}&rdquo;
                </p>
                <p className="text-[10px] uppercase tracking-wider mt-auto" style={{ color: "var(--text-muted)" }}>
                  {q.quote_date ?? ""}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
