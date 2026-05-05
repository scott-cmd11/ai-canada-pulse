"use client"

import { useEffect, useState } from "react"
import type { GovAISystem } from "@/lib/gov-ai-registry-client"
import SourceAttribution from "@/components/SourceAttribution"
import { SectionSkeleton } from "@/components/Skeleton"

const REGISTRY_URL = "https://open.canada.ca/data/en/dataset/fcbc0200-79ba-4fa4-94a6-00e32facea6b"

const STATUS_STYLES: Record<string, { classes: string; label: string }> = {
  "In production": { classes: "bg-green-50 text-green-700 border-green-200", label: "In production" },
  "In development": { classes: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "In development" },
  Retired: { classes: "bg-slate-50 text-slate-600 border-slate-200", label: "Retired" },
}

interface RegistryTotals {
  total: number
  inProduction: number
  inDevelopment: number
  publicFacing: number
}

export default function GovRegistrySection() {
  const [systems, setSystems] = useState<GovAISystem[]>([])
  const [totals, setTotals] = useState<RegistryTotals>({ total: 0, inProduction: 0, inDevelopment: 0, publicFacing: 0 })
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/v1/gov-registry")
      .then((res) => res.json())
      .then((json) => {
        const nextSystems = json.systems ?? []
        setSystems(nextSystems)
        setTotals({
          total: json.total ?? nextSystems.length,
          inProduction: json.inProduction ?? 0,
          inDevelopment: json.inDevelopment ?? 0,
          publicFacing: json.publicFacing ?? 0,
        })
        setFetchedAt(new Date().toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }))
      })
      .catch((err) => console.warn("[GovRegistrySection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  const statusOrder: Record<string, number> = { "In production": 0, "In development": 1, Retired: 2 }
  const shown = [...systems]
    .sort((a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5))
    .slice(0, 6)
  const remaining = systems.length - shown.length

  return (
    <section>
      <div className="section-header">
        <h2 className="flex items-baseline justify-between gap-3">
          <span>Federal AI Register</span>
          <span className="flex flex-wrap justify-end gap-2">
            <span
              className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
              style={{
                color: "var(--text-secondary)",
                backgroundColor: "var(--surface-primary)",
                borderColor: "var(--border-subtle)",
              }}
            >
              Evidence: system inventory
            </span>
            {!loading && systems.length > 0 && (
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {totals.total || systems.length} systems tracked
              </span>
            )}
          </span>
        </h2>
      </div>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Federal AI systems and pilots published in the Government of Canada AI Register. This is a public-sector
        adoption inventory, not a percentage adoption rate or performance ranking.
      </p>

      {loading && <SectionSkeleton title="Federal AI Register" variant="table" />}

      {!loading && systems.length === 0 && (
        <div className="py-6">
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            The AI Register is unavailable right now.
          </p>
        </div>
      )}

      {!loading && systems.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Total", value: totals.total || systems.length, classes: "bg-slate-50 text-slate-700 border-slate-200" },
            { label: "In production", value: totals.inProduction, classes: STATUS_STYLES["In production"].classes },
            { label: "In development", value: totals.inDevelopment, classes: STATUS_STYLES["In development"].classes },
            { label: "Public-facing", value: totals.publicFacing, classes: "bg-amber-50 text-amber-700 border-amber-200" },
          ].map((item) => (
            <div key={item.label} className={`rounded-lg border px-3 py-2 text-center ${item.classes}`}>
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {shown.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {shown.map((system) => {
            const status = STATUS_STYLES[system.status]
            return (
              <div key={system.id} className="saas-card p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--text-secondary)" }}>{system.department}</span>
                      {system.datePublished && (
                        <>
                          <span style={{ color: "var(--border-subtle)" }}>-</span>
                          <span>{system.datePublished}</span>
                        </>
                      )}
                    </div>
                    <a
                      href={system.url ?? REGISTRY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold leading-snug hover:underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {system.title}
                    </a>
                    {system.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {system.description}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Users: {system.primaryUsers} - Capability: {system.capabilities}
                    </p>
                  </div>

                  {status && (
                    <div className="flex shrink-0">
                      <span className={`rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${status.classes}`}>
                        {status.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {remaining > 0 && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              +{remaining} more in register
            </span>
          )}
          <a
            href={REGISTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            View full register
          </a>
        </div>
        {fetchedAt && (
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Updated: {fetchedAt}
          </span>
        )}
      </div>

      <SourceAttribution sourceId="gov-ai-register" lastUpdated={fetchedAt} />
    </section>
  )
}
