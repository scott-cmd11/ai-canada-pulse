"use client"

import { useState, useEffect } from "react"
import type { LegislationData, BillInfo } from "@/lib/legisinfo-client"
import { REGULATIONS, getDirectAIRegulations, type RegulationItem } from "@/lib/provincial-regulation-data"
import { SectionSkeleton } from "@/components/Skeleton"

// ─── Legislation Tracker ────────────────────────────────────────────────────────

function LegislationTracker() {
  const [data, setData] = useState<LegislationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/legislation")
      .then((res) => res.json())
      .then((json) => { if (json.bills) setData(json) })
      .catch((err) => console.warn("[LegislationTracker] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  // Merge live bills with curated regulations
  const directRegulations = getDirectAIRegulations()

  const STATUS_STYLES: Record<string, React.CSSProperties> = {
    "In Force": { backgroundColor: 'color-mix(in srgb, #22c55e 12%, var(--surface-primary))', color: '#15803d', border: '1px solid color-mix(in srgb, #22c55e 20%, var(--surface-primary))' },
    "Royal Assent": { backgroundColor: 'color-mix(in srgb, #10b981 12%, var(--surface-primary))', color: '#047857', border: '1px solid color-mix(in srgb, #10b981 20%, var(--surface-primary))' },
    "Committee Stage": { backgroundColor: 'color-mix(in srgb, #3b82f6 12%, var(--surface-primary))', color: '#1d4ed8', border: '1px solid color-mix(in srgb, #3b82f6 20%, var(--surface-primary))' },
    "Second Reading": { backgroundColor: 'color-mix(in srgb, #6366f1 12%, var(--surface-primary))', color: '#4338ca', border: '1px solid color-mix(in srgb, #6366f1 20%, var(--surface-primary))' },
    "First Reading": { backgroundColor: 'color-mix(in srgb, #a855f7 12%, var(--surface-primary))', color: '#7e22ce', border: '1px solid color-mix(in srgb, #a855f7 20%, var(--surface-primary))' },
    Proposed: { backgroundColor: 'color-mix(in srgb, #f59e0b 12%, var(--surface-primary))', color: '#b45309', border: '1px solid color-mix(in srgb, #f59e0b 20%, var(--surface-primary))' },
    Consultation: { backgroundColor: 'color-mix(in srgb, #14b8a6 12%, var(--surface-primary))', color: '#0f766e', border: '1px solid color-mix(in srgb, #14b8a6 20%, var(--surface-primary))' },
    "Died on Order Paper": { backgroundColor: 'color-mix(in srgb, #64748b 12%, var(--surface-primary))', color: '#64748b', border: '1px solid color-mix(in srgb, #64748b 20%, var(--surface-primary))' },
    "Died on the Order Paper": { backgroundColor: 'color-mix(in srgb, #64748b 12%, var(--surface-primary))', color: '#64748b', border: '1px solid color-mix(in srgb, #64748b 20%, var(--surface-primary))' },
  }
  const DEFAULT_STATUS_STYLE: React.CSSProperties = { backgroundColor: 'color-mix(in srgb, #64748b 12%, var(--surface-primary))', color: '#64748b', border: '1px solid color-mix(in srgb, #64748b 20%, var(--surface-primary))' }

  if (loading) return <SectionSkeleton title="AI Legislation" variant="table" />

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>AI Legislation & Regulation</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {directRegulations.length + (data?.totalAIBills ?? 0)} items tracked
          </span>
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Federal and provincial AI legislation, directives, and frameworks. Bill status from{" "}
        <a href="https://www.parl.ca/legisinfo/" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>LEGISinfo</a>.
      </p>

      {/* Key Regulations */}
      <div className="flex flex-col gap-2">
        {[...directRegulations]
          .sort((a, b) => {
            if (!a.effectiveDate && !b.effectiveDate) return 0
            if (!a.effectiveDate) return 1
            if (!b.effectiveDate) return -1
            return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
          })
          .slice(0, 4).map((reg: RegulationItem) => (
          <div
            key={reg.id}
            className="saas-card p-3"
            style={{ transition: 'background 0.2s ease, border-color 0.2s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-primary) 3%, var(--surface-primary))'
              e.currentTarget.style.borderColor = 'var(--accent-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.borderColor = ''
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <span>{reg.jurisdiction}</span>
                  <span style={{ color: 'var(--border-subtle)' }}>•</span>
                  <span>{reg.type}</span>
                </div>
                <a
                  href={reg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold hover:underline line-clamp-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {reg.name}
                </a>
                <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {reg.description}
                </p>
              </div>
              <span className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider rounded shrink-0" style={STATUS_STYLES[reg.status] || DEFAULT_STATUS_STYLE}>
                {reg.status}
              </span>
            </div>
          </div>
        ))}

        {/* Bills from LEGISinfo */}
        {data && [...data.bills]
          .sort((a, b) => {
            const da = a.statusDate ? new Date(a.statusDate).getTime() : 0
            const db = b.statusDate ? new Date(b.statusDate).getTime() : 0
            return db - da
          })
          .slice(0, 3).map((bill: BillInfo) => (
          <div
            key={bill.id}
            className="saas-card p-3"
            style={{ transition: 'background 0.2s ease, border-color 0.2s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-primary) 3%, var(--surface-primary))'
              e.currentTarget.style.borderColor = 'var(--accent-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.borderColor = ''
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <span>Federal Bill {bill.number}</span>
                  <span style={{ color: 'var(--border-subtle)' }}>•</span>
                  <span>{bill.statusDate}</span>
                </div>
                <a
                  href={bill.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold hover:underline line-clamp-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {bill.title}
                </a>
              </div>
              <span className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider rounded shrink-0" style={STATUS_STYLES[bill.status] || DEFAULT_STATUS_STYLE}>
                {bill.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Global Standing ────────────────────────────────────────────────────────────

const GLOBAL_INDICES = [
  {
    name: "Tortoise Global AI Index",
    rank: 9,
    outOf: 83,
    year: 2024,
    note: "122 indicators across implementation, innovation, and investment. Canada leads on public investment in high-end AI computing.",
    url: "https://www.tortoisemedia.com/2024/09/18/the-global-artificial-intelligence-index-2024",
  },
  {
    name: "Stanford HAI Global AI Vibrancy Tool",
    rank: 10,
    outOf: 36,
    year: 2025,
    note: "42 indicators covering research, development, talent, and economic impact.",
    url: "https://hai.stanford.edu/ai-index/global-vibrancy-tool",
  },
  {
    name: "Oxford Insights Government AI Readiness Index",
    rank: 12,
    outOf: 195,
    year: 2025,
    note: "69 indicators across policy capacity, governance, infrastructure, and public sector AI adoption.",
    url: "https://oxfordinsights.com/ai-readiness/government-ai-readiness-index-2025/",
  },
]

function GlobalStandingPanel() {
  return (
    <section className="mb-6">
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>Canada&apos;s Global AI Standing</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {GLOBAL_INDICES.length} indices tracked
          </span>
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Canada&apos;s rank across leading international AI benchmarks. These are annual publications — rankings reflect the most recent edition of each index.
      </p>
      <div className="flex flex-col gap-2">
        {GLOBAL_INDICES.map((idx) => (
          <a
            key={idx.name}
            href={idx.url}
            target="_blank"
            rel="noopener noreferrer"
            className="saas-card p-3 block"
            style={{ transition: 'background 0.2s ease, border-color 0.2s ease', textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-primary) 3%, var(--surface-primary))'
              e.currentTarget.style.borderColor = 'var(--accent-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.borderColor = ''
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  {idx.year} edition
                </div>
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {idx.name}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {idx.note}
                </p>
              </div>
              {idx.rank ? (
                <div className="shrink-0 text-right">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent-primary)' }}>
                    #{idx.rank}
                  </span>
                  {idx.outOf && (
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>of {idx.outOf}</div>
                  )}
                </div>
              ) : (
                <span
                  className="shrink-0 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider rounded"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, var(--surface-primary))', color: 'var(--accent-primary)', border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, var(--surface-primary))' }}
                >
                  View
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

// ─── Main Section ───────────────────────────────────────────────────────────────

export default function RegulatorySection() {
  return (
    <div>
      <GlobalStandingPanel />
      <LegislationTracker />
    </div>
  )
}
