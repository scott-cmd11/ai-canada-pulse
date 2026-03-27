"use client"

import { useState, useEffect } from "react"
import type { LegislationData, BillInfo } from "@/lib/legisinfo-client"
import type { OPCData, OPCDecision } from "@/lib/opc-client"
import { REGULATIONS, getDirectAIRegulations, type RegulationItem } from "@/lib/provincial-regulation-data"
import { getRadarComparison, getCanadaRank, COUNTRY_RANKINGS } from "@/lib/global-ai-index-data"
import { PATENT_RANKINGS, CANADA_PATENT_TRENDS, getCanadaPatentRank } from "@/lib/wipo-patents-data"
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

  const STATUS_COLORS: Record<string, string> = {
    "In Force": "bg-green-50 text-green-700 border-green-200",
    "Royal Assent": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Committee Stage": "bg-blue-50 text-blue-700 border-blue-200",
    "Second Reading": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "First Reading": "bg-purple-50 text-purple-700 border-purple-200",
    Proposed: "bg-amber-50 text-amber-700 border-amber-200",
    Consultation: "bg-teal-50 text-teal-700 border-teal-200",
    "Died on Order Paper": "bg-slate-50 text-slate-500 border-slate-200",
    "Died on the Order Paper": "bg-slate-50 text-slate-500 border-slate-200",
  }

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
          <div key={reg.id} className="saas-card p-3">
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
              <span className={`px-2 py-1 text-[9px] font-semibold uppercase tracking-wider rounded border shrink-0 ${STATUS_COLORS[reg.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                {reg.status}
              </span>
            </div>
          </div>
        ))}

        {/* Bills from LEGISinfo */}
        {data && data.bills.slice(0, 3).map((bill: BillInfo) => (
          <div key={bill.id} className="saas-card p-3">
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
              <span className={`px-2 py-1 text-[9px] font-semibold uppercase tracking-wider rounded border shrink-0 ${STATUS_COLORS[bill.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                {bill.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Privacy Decisions Panel ────────────────────────────────────────────────────

function PrivacyDecisionsPanel() {
  const [data, setData] = useState<OPCData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/privacy")
      .then((res) => res.json())
      .then((json) => { if (json.decisions) setData(json) })
      .catch((err) => console.warn("[PrivacyDecisionsPanel] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  const TYPE_COLORS: Record<string, string> = {
    Finding: "bg-red-50 text-red-700 border-red-200",
    Guidance: "bg-blue-50 text-blue-700 border-blue-200",
    Report: "bg-purple-50 text-purple-700 border-purple-200",
    Consultation: "bg-amber-50 text-amber-700 border-amber-200",
  }

  if (loading) return <SectionSkeleton title="Privacy Commissioner (AI)" variant="table" />

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>Privacy Commissioner (AI)</span>
          {data && data.totalDecisions > 0 && (
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {data.totalDecisions} decisions
            </span>
          )}
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        AI-related findings, guidance, and reports from the Office of the Privacy Commissioner of Canada.
      </p>

      {(!data || data.decisions.length === 0) && (
        <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>Unable to load OPC decisions.</p>
      )}

      {data && data.decisions.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.decisions.slice(0, 4).map((dec: OPCDecision) => (
            <div key={dec.id} className="saas-card p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${TYPE_COLORS[dec.type] || ""}`}>
                      {dec.type}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{dec.date}</span>
                  </div>
                  <a
                    href={dec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold hover:underline line-clamp-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {dec.title}
                  </a>
                  <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {dec.summary}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── International Benchmark Panel ──────────────────────────────────────────────

function InternationalBenchmarkPanel() {
  const canadaRank = getCanadaRank()
  const comparison = getRadarComparison(["US", "CN", "GB", "CA", "DE"])
  const patentRank = getCanadaPatentRank()

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>Global AI Standing</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Canada: #{canadaRank} overall
          </span>
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        How Canada compares globally across AI dimensions. Sources: Stanford HAI Index, Tortoise Global AI Index.
      </p>

      {/* Dimension Comparison */}
      <div className="flex flex-col gap-2 mb-4">
        {comparison.dimensions.map((dim) => {
          const dimKey = dim.toLowerCase() as keyof typeof comparison.countries[0]["dimensions"]
          const canada = comparison.countries.find((c) => c.countryCode === "CA")
          const us = comparison.countries.find((c) => c.countryCode === "US")

          return (
            <div key={dim}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{dim}</span>
                <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                  {canada?.dimensions[dimKey] ?? 0}/100
                </span>
              </div>
              <div className="relative h-4 rounded" style={{ background: 'var(--border-subtle)' }}>
                {/* US bar (background reference) */}
                <div
                  className="absolute inset-y-0 left-0 rounded opacity-20"
                  style={{ width: `${us?.dimensions[dimKey] ?? 0}%`, background: 'var(--text-muted)' }}
                />
                {/* Canada bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                  style={{ width: `${canada?.dimensions[dimKey] ?? 0}%`, background: 'var(--accent-primary)' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-[10px] flex items-center gap-3 mb-4" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded" style={{ background: 'var(--accent-primary)' }} /> Canada
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded opacity-20" style={{ background: 'var(--text-muted)' }} /> United States
        </span>
      </div>

      {/* Top 5 Countries Table */}
      <div className="text-xs">
        <div className="grid grid-cols-[2rem_1fr_3rem] gap-2 pb-1 mb-1 font-semibold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
          <span>#</span>
          <span>Country</span>
          <span className="text-right">Score</span>
        </div>
        {COUNTRY_RANKINGS.slice(0, 6).map((c, i) => (
          <div
            key={c.countryCode}
            className="grid grid-cols-[2rem_1fr_3rem] gap-2 py-1.5"
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              fontWeight: c.countryCode === "CA" ? 700 : 400,
              color: c.countryCode === "CA" ? 'var(--accent-primary)' : 'var(--text-primary)',
            }}
          >
            <span>{i + 1}</span>
            <span>{c.country}</span>
            <span className="text-right">{c.overall}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Patent Rankings Panel ──────────────────────────────────────────────────────

function PatentRankingsPanel() {
  const patentRank = getCanadaPatentRank()

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>AI Patent Rankings</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Canada: #{patentRank} globally
          </span>
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        AI patent families by country (IPC G06N). Source: WIPO IP Statistics.
      </p>

      {/* Top Patent Countries */}
      <div className="flex flex-col gap-1.5 mb-4">
        {PATENT_RANKINGS.slice(0, 8).map((c) => {
          const maxPatents = PATENT_RANKINGS[0].totalPatents
          const pct = (c.totalPatents / maxPatents) * 100
          const isCanada = c.countryCode === "CA"
          return (
            <div key={c.countryCode} className="flex items-center gap-2">
              <span className="text-[10px] font-medium w-6 shrink-0" style={{ color: isCanada ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {c.countryCode}
              </span>
              <div className="flex-1 h-5 rounded" style={{ background: 'var(--border-subtle)' }}>
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: isCanada ? 'var(--accent-primary)' : 'var(--text-muted)',
                    opacity: isCanada ? 1 : 0.3,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-semibold w-14 text-right"
                style={{ color: isCanada ? 'var(--accent-primary)' : 'var(--text-primary)' }}
              >
                {c.totalPatents >= 1000 ? `${(c.totalPatents / 1000).toFixed(0)}K` : c.totalPatents}
              </span>
            </div>
          )
        })}
      </div>

      {/* Canada Patent Trends */}
      <div className="pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Canada AI Patent Filings (Annual)
        </p>
        <div className="flex gap-3">
          {CANADA_PATENT_TRENDS.slice(-4).map((t) => (
            <div key={t.year} className="text-center">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                {(t.filings / 1000).toFixed(1)}K
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.year}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Main Section ───────────────────────────────────────────────────────────────

export default function RegulatorySection() {
  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LegislationTracker />
        <PrivacyDecisionsPanel />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <InternationalBenchmarkPanel />
        <PatentRankingsPanel />
      </div>
    </div>
  )
}
