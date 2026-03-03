"use client"

import { useState, useEffect } from "react"
import type { GovAISystem } from "@/lib/gov-ai-registry-client"

const RISK_MAP: Record<string, { classes: string; label: string }> = {
  High: { classes: "bg-red-50 text-red-700 border-red-200", label: "High Risk" },
  Moderate: { classes: "bg-amber-50 text-amber-700 border-amber-200", label: "Moderate Risk" },
  Low: { classes: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Low Risk" },
  Minimal: { classes: "bg-green-50 text-green-700 border-green-200", label: "Minimal Risk" },
}

const REGISTRY_URL = "https://open.canada.ca/data/en/dataset/fcbc0200-79ba-4fa4-94a6-00e32facea6b"

export default function GovRegistrySection() {
  const [systems, setSystems] = useState<GovAISystem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/v1/gov-registry")
      .then((res) => res.json())
      .then((json) => {
        if (json.systems?.length > 0) setSystems(json.systems)
        setFetchedAt(new Date().toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }))
      })
      .catch((err) => console.warn("[GovRegistrySection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  const shown = systems.slice(0, 5)
  const remaining = systems.length - shown.length

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>Federal AI Registry</span>
          {!loading && systems.length > 0 && (
            <span className="text-sm font-medium text-slate-500">
              {systems.length} deployments tracked
            </span>
          )}
        </h2>
      </div>

      {loading && (
        <div className="py-6">
          <p className="text-sm font-medium text-slate-500">Synchronizing with TBS database...</p>
        </div>
      )}

      {!loading && systems.length === 0 && (
        <div className="py-6">
          <p className="text-sm font-medium text-slate-500">Failed to retrieve registry definitions.</p>
        </div>
      )}

      {shown.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {shown.map((sys) => (
            <div key={sys.id} className="saas-card bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span className="text-slate-700">{sys.department}</span>
                  {sys.datePublished && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>{sys.datePublished}</span>
                    </>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {sys.url ? (
                    <a
                      href={sys.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-700 hover:underline"
                    >
                      {sys.title}
                    </a>
                  ) : (
                    sys.title
                  )}
                </h3>
              </div>

              {RISK_MAP[sys.riskLevel] && (
                <div className="flex shrink-0">
                  <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded border ${RISK_MAP[sys.riskLevel].classes}`}>
                    {RISK_MAP[sys.riskLevel].label}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer: remaining count + link + timestamp */}
      <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
        <div className="flex items-center gap-3">
          {remaining > 0 && (
            <span className="text-xs text-slate-500">+{remaining} more in registry</span>
          )}
          <a
            href={REGISTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
          >
            View Full Registry →
          </a>
        </div>
        {fetchedAt && (
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            Last updated: {fetchedAt}
          </span>
        )}
      </div>

      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
        Source: <a href="https://open.canada.ca/data/en/dataset/fcbc0200-79ba-4fa4-94a6-00e32facea6b" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline">Open Canada</a> · Federal AI Registry
      </p>
    </section>
  )
}

