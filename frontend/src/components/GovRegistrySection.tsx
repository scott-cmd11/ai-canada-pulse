"use client"

import { useState, useEffect } from "react"
import type { GovAISystem } from "@/lib/gov-ai-registry-client"
import SourceAttribution from '@/components/SourceAttribution'

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

  const RISK_ORDER: Record<string, number> = { High: 0, Moderate: 1, Low: 2, Minimal: 3, Unclassified: 4 }
  const sorted = [...systems].sort((a, b) => (RISK_ORDER[a.riskLevel] ?? 5) - (RISK_ORDER[b.riskLevel] ?? 5))
  const shown = sorted.slice(0, 6)
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
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {systems.length} deployments tracked
            </span>
          )}
        </h2>
      </div>
      <p className="text-sm mb-4 max-w-3xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        AI systems deployed by federal departments, sourced from{" "}
        <a href="https://open.canada.ca/data/en/dataset/fcbc0200-79ba-4fa4-94a6-00e32facea6b" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>Open Canada</a>.
        Risk levels are assigned by each department using Canada&apos;s{" "}
        <a href="https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/algorithmic-impact-assessment.html" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>Algorithmic Impact Assessment (AIA)</a>{" "}
        framework — a mandatory tool that scores AI systems from Level I (minimal) to Level IV (high risk) based on potential impact on rights, health, and safety.
      </p>

      {loading && (
        <div className="py-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Synchronizing with TBS database...</p>
        </div>
      )}

      {!loading && systems.length === 0 && (
        <div className="py-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Failed to retrieve registry definitions.</p>
        </div>
      )}

      {/* Risk Distribution */}
      {!loading && systems.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          {(["High", "Moderate", "Low", "Minimal", "Unclassified"] as const).map((level) => {
            const risk = RISK_MAP[level] || { classes: "bg-slate-50 text-slate-600 border-slate-200", label: "Not Specified" }
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

      {shown.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {shown.map((sys) => (
            <div key={sys.id} className="saas-card p-4">

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{sys.department}</span>
                    {sys.datePublished && (
                      <>
                        <span style={{ color: 'var(--border-subtle)' }}>•</span>
                        <span>{sys.datePublished}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {sys.url ? (
                      <a
                        href={sys.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                      >
                        {sys.title}
                      </a>
                    ) : (
                      sys.title
                    )}
                  </h3>

                  {sys.description && (
                    <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
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
        <div className="flex items-center gap-3">
          {remaining > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{remaining} more in registry</span>
          )}
          <a
            href={REGISTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--accent-primary)' }}
          >
            View Full Registry →
          </a>
        </div>
        {fetchedAt && (
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Last updated: {fetchedAt}
          </span>
        )}
      </div>

      <SourceAttribution sourceId="gov-ai-registry" />
    </section>
  )
}

