"use client"

import { useState, useEffect } from "react"
import type { ParliamentMention, ParliamentData } from "@/lib/parliament-client"
import SourceAttribution from '@/components/SourceAttribution'
import SectionSummary from '@/components/SectionSummary'

import type { CSSProperties } from "react"

const PARTY_STYLES: Record<string, CSSProperties> = {
  Liberal: { backgroundColor: 'color-mix(in srgb, #ef4444 12%, var(--surface-primary))', color: '#b91c1c', border: '1px solid color-mix(in srgb, #ef4444 20%, var(--surface-primary))' },
  Conservative: { backgroundColor: 'color-mix(in srgb, #3b82f6 12%, var(--surface-primary))', color: '#1d4ed8', border: '1px solid color-mix(in srgb, #3b82f6 20%, var(--surface-primary))' },
  NDP: { backgroundColor: 'color-mix(in srgb, #f59e0b 12%, var(--surface-primary))', color: '#b45309', border: '1px solid color-mix(in srgb, #f59e0b 20%, var(--surface-primary))' },
  "Bloc Québécois": { backgroundColor: 'color-mix(in srgb, #0ea5e9 12%, var(--surface-primary))', color: '#0369a1', border: '1px solid color-mix(in srgb, #0ea5e9 20%, var(--surface-primary))' },
  Green: { backgroundColor: 'color-mix(in srgb, #22c55e 12%, var(--surface-primary))', color: '#15803d', border: '1px solid color-mix(in srgb, #22c55e 20%, var(--surface-primary))' },
}
const DEFAULT_PARTY_STYLE: CSSProperties = { backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }

export default function ParliamentSection() {
  const [data, setData] = useState<ParliamentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/v1/parliament", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
        setSummary(json.summary ?? null)
      })
      .catch((err) => console.warn("[ParliamentSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <div className="section-header">
        <h2>Parliamentary Records</h2>
      </div>
      <SectionSummary summary={summary} />
      <p className="text-sm mb-4 max-w-3xl leading-relaxed" style={{ color: 'var(--text-on-invert-muted)' }}>
        Mentions of artificial intelligence in House of Commons debates, sourced from OpenParliament.ca. Tracks which MPs and parties are engaging with AI policy.{' '}
        <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Federal Parliament only — provincial and territorial legislatures are not included.</span>
      </p>

      {loading && (
        <div className="py-8">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Scanning Hansard database...</p>
        </div>
      )}

      {!loading && (!data || data.mentions.length === 0) && (
        <div className="py-8">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No recent parliamentary activity logged.</p>
        </div>
      )}

      {/* Remove hidden overflow that was clipping text, let the table flow */}
      {data && data.mentions.length > 0 && (
        <div className="saas-card overflow-x-auto" style={{ backgroundColor: 'var(--surface-primary)' }}>
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="border-b" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
              <tr>
                <th className="py-3 px-4 md:px-6 text-xs font-semibold tracking-wider uppercase w-[110px]" style={{ color: 'var(--text-muted)' }}>Date</th>
                <th className="py-3 px-4 md:px-6 text-xs font-semibold tracking-wider uppercase min-w-[140px]" style={{ color: 'var(--text-muted)' }}>Member</th>
                <th className="py-3 px-4 md:px-6 text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Excerpt</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {data.mentions.map((m, i) => (
                <MentionRow key={`${m.url}-${i}`} mention={m} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SourceAttribution sourceId="openparliament" />
    </section>
  )
}

function MentionRow({ mention }: { mention: ParliamentMention }) {
  const partyStyle = PARTY_STYLES[mention.party || ""] || DEFAULT_PARTY_STYLE

  return (
    <tr className="transition-colors align-top" style={{ ['--hover-bg' as string]: 'var(--surface-secondary)' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface-secondary)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
      <td className="py-4 px-4 md:px-6 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
        {mention.date}
      </td>

      <td className="py-4 px-4 md:px-6">
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {mention.speaker}
          </span>
          {mention.party && (
            <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded" style={partyStyle}>
              {mention.party}
            </span>
          )}
        </div>
      </td>

      <td className="py-4 px-4 md:px-6 text-sm leading-relaxed max-w-[500px]">
        {mention.excerpt && (
          /* Eradicate line-clamp to prevent truncation bugs entirely */
          <p className="italic border-l-2 pl-3 mb-2" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>"{mention.excerpt}"</p>
        )}
        <a
          href={mention.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold uppercase tracking-wider hover:underline"
          style={{ color: 'var(--accent-primary)' }}
        >
          View Transcript &rarr;
        </a>
      </td>
    </tr>
  )
}
