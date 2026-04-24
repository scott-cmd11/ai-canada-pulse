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
    fetch("/api/v1/quotes?limit=3")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        setQuotes(Array.isArray(json.data) ? json.data : [])
      })
      .catch((err) => console.warn("[QuotesTeaser] fetch failed:", err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="py-4">
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Loading quotes archive…
        </p>
      </div>
    )
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          The quotes archive is warming up.
        </p>
        <Link
          href="/quotes"
          className="text-xs font-bold uppercase tracking-wider hover:underline"
          style={{ color: "var(--accent-primary)" }}
        >
          See the archive &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quotes.map((q) => {
          const partyStyle = PARTY_STYLES[q.party ?? ""] ?? DEFAULT_PARTY_STYLE
          return (
            <div
              key={q.id}
              className="saas-card p-4 flex flex-col gap-2"
              style={{ backgroundColor: "var(--surface-primary)" }}
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
      <Link
        href="/quotes"
        className="self-end text-xs font-bold uppercase tracking-wider hover:underline"
        style={{ color: "var(--accent-primary)" }}
      >
        See the full archive &rarr;
      </Link>
    </div>
  )
}
