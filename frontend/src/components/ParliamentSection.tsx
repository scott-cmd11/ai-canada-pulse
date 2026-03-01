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

      {loading && (
        <div className="py-8">
          <p className="text-sm font-medium text-slate-500">Scanning Hansard database...</p>
        </div>
      )}

      {!loading && (!data || data.mentions.length === 0) && (
        <div className="py-8">
          <p className="text-sm font-medium text-slate-500">No recent parliamentary activity logged.</p>
        </div>
      )}

      {/* Remove hidden overflow that was clipping text, let the table flow */}
      {data && data.mentions.length > 0 && (
        <div className="saas-card bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 md:px-6 text-xs font-semibold tracking-wider uppercase text-slate-500 w-[110px]">Date</th>
                <th className="py-3 px-4 md:px-6 text-xs font-semibold tracking-wider uppercase text-slate-500 min-w-[140px]">Member</th>
                <th className="py-3 px-4 md:px-6 text-xs font-semibold tracking-wider uppercase text-slate-500">Excerpt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.mentions.map((m, i) => (
                <MentionRow key={`${m.url}-${i}`} mention={m} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function MentionRow({ mention }: { mention: ParliamentMention }) {
  const badgeClass = PARTY_BADGES[mention.party || ""] || "bg-slate-50 text-slate-600 border-slate-200"

  return (
    <tr className="hover:bg-slate-50 transition-colors align-top">
      <td className="py-4 px-4 md:px-6 text-sm font-medium text-slate-500 whitespace-nowrap">
        {mention.date}
      </td>

      <td className="py-4 px-4 md:px-6">
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-sm font-bold text-slate-900">
            {mention.speaker}
          </span>
          {mention.party && (
            <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded border ${badgeClass}`}>
              {mention.party}
            </span>
          )}
        </div>
      </td>

      <td className="py-4 px-4 md:px-6 text-sm leading-relaxed max-w-[500px]">
        {mention.excerpt && (
          /* Eradicate line-clamp to prevent truncation bugs entirely */
          <p className="text-slate-700 italic border-l-2 border-slate-200 pl-3 mb-2">"{mention.excerpt}"</p>
        )}
        <a
          href={mention.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold uppercase tracking-wider text-indigo-700 hover:text-indigo-900"
        >
          View Transcript &rarr;
        </a>
      </td>
    </tr>
  )
}
