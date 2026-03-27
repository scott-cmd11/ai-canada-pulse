"use client"

import { useState, useEffect } from "react"
import type { ParliamentMention, ParliamentData } from "@/lib/parliament-client"

const PARTY_BADGES: Record<string, string> = {
  Liberal: "bg-red-50 text-red-700 border-red-200",
  Conservative: "bg-blue-50 text-blue-700 border-blue-200",
  NDP: "bg-amber-50 text-amber-700 border-amber-200",
  "Bloc Québécois": "bg-sky-50 text-sky-700 border-sky-200",
  Green: "bg-green-50 text-green-700 border-green-200",
}

export default function ParliamentSection() {
  const [data, setData] = useState<ParliamentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/parliament", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
      })
      .catch((err) => console.warn("[ParliamentSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <div className="section-header">
        <h2>Parliamentary Records</h2>
      </div>
      <p className="text-sm mb-4 max-w-3xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Recent mentions of artificial intelligence in House of Commons debates and committee proceedings, sourced from OpenParliament.ca. Tracks which MPs and parties are engaging with AI policy and the tone of their discourse.
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

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>
        Source: <a href="https://openparliament.ca" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>OpenParliament.ca</a>
      </p>
    </section>
  )
}

function MentionRow({ mention }: { mention: ParliamentMention }) {
  const knownBadgeClass = PARTY_BADGES[mention.party || ""]
  const badgeClass = knownBadgeClass || ""
  const badgeStyle = !knownBadgeClass ? {
    backgroundColor: 'var(--surface-secondary)',
    color: 'var(--text-secondary)',
    borderColor: 'var(--border-subtle)',
  } : undefined

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
            <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded border ${badgeClass}`} style={badgeStyle}>
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
