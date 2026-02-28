"use client"

import { useState, useEffect } from "react"
import type { ParliamentMention, ParliamentData } from "@/lib/parliament-client"

const PARTY_COLORS: Record<string, string> = {
  Liberal: "text-red-400",
  Conservative: "text-blue-400",
  NDP: "text-orange-400",
  "Bloc Québécois": "text-cyan-400",
  Green: "text-green-400",
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
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        AI in Parliament
      </h2>

      {loading && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Loading parliamentary debates from OpenParliament...</p>
        </div>
      )}

      {!loading && (!data || data.mentions.length === 0) && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Unable to load parliamentary data at this time.</p>
        </div>
      )}

      {data && data.mentions.length > 0 && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50">
            <span className="text-sm font-medium text-slate-200">
              Recent AI-related debates in the House of Commons
            </span>
          </div>

          <div className="divide-y divide-slate-700/30 max-h-[360px] overflow-y-auto">
            {data.mentions.map((m, i) => (
              <MentionRow key={`${m.url}-${i}`} mention={m} />
            ))}
          </div>
        </div>
      )}

      {data && data.mentions.length > 0 && (
        <p className="text-[10px] text-slate-600 mt-2">
          Source: OpenParliament.ca — tracking mentions of AI, AIDA, and machine learning
        </p>
      )}
    </section>
  )
}

function MentionRow({ mention }: { mention: ParliamentMention }) {
  return (
    <div className="px-4 py-3 hover:bg-slate-700/20 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-slate-200">{mention.speaker}</span>
        {mention.party && (
          <span className={`text-[10px] ${PARTY_COLORS[mention.party] || "text-slate-400"}`}>
            {mention.party}
          </span>
        )}
        <span className="text-[10px] text-slate-600 ml-auto">{mention.date}</span>
      </div>

      {mention.excerpt && (
        <p className="text-xs text-slate-400 line-clamp-2">{mention.excerpt}</p>
      )}

      <a
        href={mention.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-blue-400/70 hover:text-blue-400 mt-1 inline-block"
      >
        Read full statement
      </a>
    </div>
  )
}
