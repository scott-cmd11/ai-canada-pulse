"use client"

import { useState, useEffect } from "react"
import type { GovAISystem } from "@/lib/gov-ai-registry-client"

const RISK_MAP: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Minimal: "bg-green-50 text-green-700 border-green-200",
  Unclassified: "bg-slate-50 text-slate-600 border-slate-200",
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
      .catch((err) => console.warn("[GovRegistrySection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>Federal AI Registry</span>
          {!loading && systems.length > 0 && (
            <span className="text-sm font-medium text-slate-500">
              {systems.length} total deployments
            </span>
          )}
        </h2>
      </div>

      {loading && (
        <div className="py-8">
          <p className="text-sm font-medium text-slate-500">Synchronizing with TBS database...</p>
        </div>
      )}

      {!loading && systems.length === 0 && (
        <div className="py-8">
          <p className="text-sm font-medium text-slate-500">Failed to retrieve registry definitions.</p>
        </div>
      )}

      {systems.length > 0 && (
        <div className="flex flex-col gap-3">
          {systems.slice(0, 10).map((sys) => (
            <div key={sys.id} className="saas-card bg-white p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span className="text-slate-700">{sys.department}</span>
                  {sys.datePublished && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>{sys.datePublished}</span>
                    </>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
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

                {/* Removed line-clamp constraints to prevent layout breaks on resize */}
                {sys.description && (
                  <p className="text-sm text-slate-600 leading-relaxed mt-1.5">
                    {sys.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 mt-3 md:mt-0">
                <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded border ${RISK_MAP[sys.riskLevel] || RISK_MAP.Unclassified}`}>
                  {sys.riskLevel} Risk
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
