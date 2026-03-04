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

  // Count systems by risk level
  const riskCounts = systems.reduce<Record<string, number>>((acc, sys) => {
    acc[sys.riskLevel] = (acc[sys.riskLevel] || 0) + 1
    return acc
  }, {})

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
      <p className="text-sm text-slate-600 mb-4 max-w-3xl leading-relaxed">
        AI systems deployed by federal government departments, sourced from the Treasury Board Secretariat&apos;s public registry. Tracks each system&apos;s assessed risk level, helping monitor how the Government of Canada is adopting and governing AI in public services.
      </p>

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

      {/* Risk Distribution */}
      {!loading && systems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {(["High", "Moderate", "Low", "Minimal"] as const).map((level) => {
            const risk = RISK_MAP[level]
            const count = riskCounts[level] || 0
            return (
              <div key={level} className={`rounded-lg border px-3 py-2 text-center ${risk.classes}`}>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider">{risk.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {systems.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {systems.map((sys) => (
            <div key={sys.id} className="saas-card bg-white p-4">

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
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

                  {sys.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {sys.description}
                    </p>
                  )}
                </div>

                {RISK_MAP[sys.riskLevel] && (
                  <div className="flex shrink-0">
                    <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded border ${RISK_MAP[sys.riskLevel].classes}`}>
                      {RISK_MAP[sys.riskLevel].label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
        <a
          href={REGISTRY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
        >
          View Full Registry →
        </a>
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

