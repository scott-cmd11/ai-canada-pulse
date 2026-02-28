"use client"

import { useState, useEffect } from "react"
import type { GovAISystem } from "@/lib/gov-ai-registry-client"

const RISK_COLORS: Record<string, string> = {
  High: "text-red-400 bg-red-500/10 border-red-500/20",
  Moderate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Minimal: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Unclassified: "text-slate-400 bg-slate-500/10 border-slate-500/20",
}

export default function GovRegistrySection() {
  const [systems, setSystems] = useState<GovAISystem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/gov-registry")
      .then((res) => res.json())
      .then((json) => {
        if (json.systems?.length > 0) setSystems(json.systems)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Federal AI Systems Registry
      </h2>

      {loading && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Loading federal AI registry from Open Canada...</p>
        </div>
      )}

      {!loading && systems.length === 0 && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Unable to load government AI registry data at this time.</p>
        </div>
      )}

      {systems.length > 0 && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 overflow-hidden">
          {/* Summary bar */}
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-4">
            <span className="text-sm font-medium text-slate-200">
              {systems.length} AI system{systems.length !== 1 ? "s" : ""} tracked
            </span>
            <RiskSummary systems={systems} />
          </div>

          {/* System list */}
          <div className="divide-y divide-slate-700/30 max-h-[400px] overflow-y-auto">
            {systems.map((sys) => (
              <div key={sys.id} className="px-4 py-3 hover:bg-slate-700/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-200 leading-snug">
                      {sys.url ? (
                        <a
                          href={sys.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-400 transition-colors"
                        >
                          {sys.title}
                        </a>
                      ) : (
                        sys.title
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{sys.department}</p>
                    {sys.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sys.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${RISK_COLORS[sys.riskLevel] || RISK_COLORS.Unclassified}`}
                  >
                    {sys.riskLevel}
                  </span>
                </div>
                {sys.datePublished && (
                  <p className="text-[10px] text-slate-600 mt-1">{sys.datePublished}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {systems.length > 0 && (
        <p className="text-[10px] text-slate-600 mt-2">
          Source: Open Canada (CKAN) — Treasury Board Algorithmic Impact Assessments
        </p>
      )}
    </section>
  )
}

function RiskSummary({ systems }: { systems: GovAISystem[] }) {
  const counts: Record<string, number> = {}
  for (const s of systems) counts[s.riskLevel] = (counts[s.riskLevel] || 0) + 1

  return (
    <div className="flex items-center gap-2">
      {Object.entries(counts).map(([level, count]) => (
        <span
          key={level}
          className={`text-[10px] px-1.5 py-0.5 rounded border ${RISK_COLORS[level] || RISK_COLORS.Unclassified}`}
        >
          {count} {level}
        </span>
      ))}
    </div>
  )
}
