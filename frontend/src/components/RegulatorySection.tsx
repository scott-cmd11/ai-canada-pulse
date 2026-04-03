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
        {directRegulations.slice(0, 4).map((reg: RegulationItem) => (
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
        {data && data.bills.slice(0, 3).map((bill: BillInfo) => (
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

// ─── Main Section ───────────────────────────────────────────────────────────────

export default function RegulatorySection() {
  return (
    <div>
      <LegislationTracker />
    </div>
  )
}
