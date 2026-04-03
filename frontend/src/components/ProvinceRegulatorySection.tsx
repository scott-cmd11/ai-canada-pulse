"use client"

import { useState, useEffect } from "react"
import type { LegislationData, BillInfo } from "@/lib/legisinfo-client"
import { getRegulationsByJurisdiction, type RegulationItem } from "@/lib/provincial-regulation-data"

interface ProvinceRegulatorySectionProps {
  provinceSlug: string
  provinceName: string
}

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

const CARD_HOVER = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-primary) 3%, var(--surface-primary))'
    e.currentTarget.style.borderColor = 'var(--accent-primary)'
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = ''
    e.currentTarget.style.borderColor = ''
  },
}

export default function ProvinceRegulatorySection({ provinceSlug, provinceName }: ProvinceRegulatorySectionProps) {
  const [bills, setBills] = useState<BillInfo[]>([])
  const [billsLoading, setBillsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/legislation")
      .then((res) => res.json())
      .then((json: LegislationData) => { if (json.bills) setBills(json.bills) })
      .catch((err) => console.warn("[ProvinceRegulatorySection] fetch failed:", err))
      .finally(() => setBillsLoading(false))
  }, [])

  const provincialRegs: RegulationItem[] = [...getRegulationsByJurisdiction(provinceSlug)]
    .sort((a, b) => {
      if (!a.effectiveDate && !b.effectiveDate) return 0
      if (!a.effectiveDate) return 1
      if (!b.effectiveDate) return -1
      return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    })

  const sortedBills: BillInfo[] = [...bills].sort((a, b) =>
    b.statusDate.localeCompare(a.statusDate)
  )

  const totalItems = provincialRegs.length + sortedBills.length

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>AI Legislation & Regulation</span>
          {!billsLoading && (
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {totalItems} items tracked
            </span>
          )}
        </h2>
      </div>

      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {provinceName}-specific AI policies and provincial legislation, plus live federal bill status from{" "}
        <a href="https://www.parl.ca/legisinfo/" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>
          LEGISinfo
        </a>.
      </p>

      <div className="flex flex-col gap-2">
        {/* Provincial-specific items */}
        {provincialRegs.length > 0 && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] mt-1 mb-1" style={{ color: 'var(--text-muted)' }}>
              Provincial
            </div>
            {provincialRegs.map((reg) => (
              <div
                key={reg.id}
                className="saas-card p-3"
                style={{ transition: 'background 0.2s ease, border-color 0.2s ease' }}
                {...CARD_HOVER}
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
          </>
        )}

        {/* Federal bills from LEGISinfo */}
        {(billsLoading || sortedBills.length > 0) && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] mt-2 mb-1" style={{ color: 'var(--text-muted)' }}>
              Federal (applies nationwide)
            </div>
            {billsLoading ? (
              <div className="saas-card p-3 animate-pulse" style={{ minHeight: 60 }}>
                <div className="h-3 w-48 rounded mb-2" style={{ background: 'var(--border-subtle)' }} />
                <div className="h-2 w-full rounded" style={{ background: 'var(--border-subtle)' }} />
              </div>
            ) : (
              sortedBills.map((bill) => (
                <div
                  key={bill.id}
                  className="saas-card p-3"
                  style={{ transition: 'background 0.2s ease, border-color 0.2s ease' }}
                  {...CARD_HOVER}
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
              ))
            )}
          </>
        )}

        {/* No data state */}
        {!billsLoading && provincialRegs.length === 0 && sortedBills.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No AI-specific legislation tracked for {provinceName} yet.
          </p>
        )}
      </div>
    </section>
  )
}
