"use client"

import { useEffect, useState } from "react"
import type { ProcurementDemandData, ProcurementDemandSignal } from "@/lib/procurement-demand-client"
import SourceAttribution from "@/components/SourceAttribution"
import { SectionSkeleton } from "@/components/Skeleton"

function formatMoney(value: number | null) {
  if (!value) return null
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value)
}

function SignalCard({ signal }: { signal: ProcurementDemandSignal }) {
  const amount = formatMoney(signal.value)

  return (
    <a
      href={signal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="saas-card block p-3 hover:underline"
      style={{ textDecoration: "none" }}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        <span>{signal.kind === "tender" ? "Open tender" : "Awarded contract"}</span>
        {signal.publishedAt && (
          <>
            <span style={{ color: "var(--border-subtle)" }}>-</span>
            <span>{signal.publishedAt}</span>
          </>
        )}
        {amount && (
          <>
            <span style={{ color: "var(--border-subtle)" }}>-</span>
            <span>{amount}</span>
          </>
        )}
      </div>
      <h3 className="text-sm font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
        {signal.title}
      </h3>
      <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
        {signal.organization}
      </p>
      {signal.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {signal.description}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {signal.categories.map((category) => (
          <span
            key={category}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
              color: "var(--accent-primary)",
            }}
          >
            {category}
          </span>
        ))}
      </div>
    </a>
  )
}

export default function ProcurementDemandSection() {
  const [data, setData] = useState<ProcurementDemandData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/procurement-demand")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.warn("[ProcurementDemandSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SectionSkeleton title="Procurement demand" variant="table" />

  const signals = data?.signals ?? []
  const fetchedLabel = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null

  return (
    <section>
      <div className="section-header">
        <h2 className="flex items-baseline justify-between gap-3">
          <span>Procurement Demand Signals</span>
          <span className="flex flex-wrap justify-end gap-2">
            <span
              className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
              style={{
                color: "var(--text-secondary)",
                backgroundColor: "var(--surface-primary)",
                borderColor: "var(--border-subtle)",
              }}
            >
              Evidence: demand signal
            </span>
            {signals.length > 0 && (
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {signals.length} reviewable signals
              </span>
            )}
          </span>
        </h2>
      </div>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        AI, automation, cloud, and data-related procurement notices and recent contract samples. These are demand
        signals, not proof that AI has been adopted or delivered.
      </p>

      {signals.length === 0 ? (
        <p className="py-4 text-sm" style={{ color: "var(--text-muted)" }}>
          No AI-related procurement demand signals were detected in the latest source sample.
        </p>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {signals.slice(0, 8).map((signal) => (
            <SignalCard key={`${signal.kind}-${signal.id}`} signal={signal} />
          ))}
        </div>
      )}

      <SourceAttribution sourceId="canadabuys-tenders" lastUpdated={fetchedLabel} />
    </section>
  )
}
