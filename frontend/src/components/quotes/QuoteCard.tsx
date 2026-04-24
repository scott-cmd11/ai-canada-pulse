"use client"

import type { Quote } from "@/lib/quotes/types"
import { PARTY_STYLES, DEFAULT_PARTY_STYLE } from "@/lib/party-styles"

const JURISDICTION_LABELS: Record<string, string> = {
  federal: "Federal",
  on: "Ontario",
  qc: "Québec",
  bc: "British Columbia",
  ab: "Alberta",
}

const CHAMBER_LABELS: Record<string, string> = {
  house: "House of Commons",
  senate: "Senate",
  provincial_legislature: "Provincial Legislature",
  executive: "Executive",
}

export default function QuoteCard({ quote }: { quote: Quote }) {
  const partyStyle = PARTY_STYLES[quote.party ?? ""] ?? DEFAULT_PARTY_STYLE
  const jurisdictionLabel = JURISDICTION_LABELS[quote.jurisdiction] ?? quote.jurisdiction
  const chamberLabel = quote.chamber ? CHAMBER_LABELS[quote.chamber] : null

  return (
    <article className="saas-card p-5 sm:p-6" style={{ backgroundColor: "var(--surface-primary)" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-base sm:text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
            {quote.speaker_name}
          </h3>
          {quote.speaker_role && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{quote.speaker_role}</p>
          )}
        </div>
        <span className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
          {quote.quote_date ?? "—"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {quote.party && (
          <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded" style={partyStyle}>
            {quote.party}
          </span>
        )}
        <span
          className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded"
          style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {jurisdictionLabel}
        </span>
        {chamberLabel && (
          <span
            className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded"
            style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            {chamberLabel}
          </span>
        )}
        {quote.language === "fr" && (
          <span
            className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded"
            style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            FR
          </span>
        )}
      </div>

      <blockquote
        className="border-l-2 pl-4 mb-4"
        style={{ borderColor: "var(--accent-primary)" }}
      >
        <p
          className="text-base sm:text-[17px] leading-relaxed"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
            fontWeight: 500,
          }}
        >
          &ldquo;{quote.quote_text}&rdquo;
        </p>
      </blockquote>

      {quote.context_excerpt && (
        <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <span className="font-semibold uppercase tracking-wider mr-1">Context:</span>
          {quote.context_excerpt}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex flex-wrap gap-1">
          {(quote.topics ?? []).map((topic) => (
            <span
              key={topic}
              className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded"
              style={{ color: "var(--text-muted)", backgroundColor: "var(--surface-secondary)" }}
            >
              {topic}
            </span>
          ))}
        </div>
        {quote.source_url && (
          <a
            href={quote.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-wider hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            View Source &rarr;
          </a>
        )}
      </div>
    </article>
  )
}
