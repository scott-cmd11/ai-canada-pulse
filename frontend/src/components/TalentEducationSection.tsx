"use client"

import { useState, useEffect } from "react"
import type { ImmigrationData } from "@/lib/ircc-client"
import type { NSERCData, NSERCGrant } from "@/lib/nserc-client"
import { UNIVERSITY_PROGRAMS, getProgramStats, type UniversityProgram } from "@/lib/university-programs-data"
import { SectionSkeleton } from "@/components/Skeleton"

// ─── Immigration Panel ──────────────────────────────────────────────────────────

function ImmigrationPanel({ dark }: { dark?: boolean }) {
  const [data, setData] = useState<ImmigrationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/immigration")
      .then((res) => res.json())
      .then((json) => { if (json.techWorkPermits) setData(json) })
      .catch((err) => console.warn("[ImmigrationPanel] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SectionSkeleton title="Tech Immigration" variant="chart" />

  if (!data || data.techWorkPermits.length === 0) {
    return (
      <section>
        <div className="section-header"><h2>Tech Immigration</h2></div>
        <p className="text-sm" style={{ color: dark ? 'var(--text-on-invert-muted)' : 'var(--text-muted)' }}>Unable to load immigration data.</p>
      </section>
    )
  }

  const textPrimary = dark ? 'var(--text-on-invert)' : 'var(--text-primary)'
  const textMuted = dark ? 'var(--text-on-invert-muted)' : 'var(--text-muted)'
  const textSecondary = dark ? 'var(--text-on-invert-secondary)' : 'var(--text-secondary)'

  return (
    <section>
      <div className="section-header">
        <h2 style={{ color: textPrimary }}>Tech Immigration</h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: textSecondary }}>
        LMIA-exempt tech work permits issued annually, sourced from IRCC open data and annual reports.
      </p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg p-3" style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'var(--surface-secondary, rgba(0,0,0,0.02))' }}>
          <p className="text-2xl font-bold" style={{ color: textPrimary, fontFamily: 'var(--font-display)' }}>
            {data.totalTechWorkers.toLocaleString()}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Tech work permits (latest yr)</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'var(--surface-secondary, rgba(0,0,0,0.02))' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-display)' }}>
            +{data.growthRate}%
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Year-over-year growth</p>
        </div>
      </div>

      {/* Bar Chart (CSS-only) */}
      <div className="flex flex-col gap-2">
        {data.techWorkPermits.slice(-5).map((dp) => {
          const maxCount = Math.max(...data.techWorkPermits.map((d) => d.count))
          const pct = maxCount > 0 ? (dp.count / maxCount) * 100 : 0
          return (
            <div key={dp.year} className="flex items-center gap-3">
              <span className="text-xs font-medium w-10 shrink-0" style={{ color: textMuted }}>{dp.year}</span>
              <div className="flex-1 h-6 rounded" style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'var(--border-subtle)' }}>
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{ width: `${pct}%`, background: 'var(--accent-primary)' }}
                />
              </div>
              <span className="text-xs font-semibold w-16 text-right" style={{ color: textPrimary }}>
                {dp.count.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>

      {data.expressEntry.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${dark ? 'var(--border-on-invert)' : 'var(--border-subtle)'}` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textMuted }}>Express Entry STEM Draws</p>
          <div className="flex gap-4">
            {data.expressEntry.slice(-3).map((dp) => (
              <div key={dp.year}>
                <p className="text-sm font-bold" style={{ color: textPrimary }}>{dp.count.toLocaleString()}</p>
                <p className="text-[10px]" style={{ color: textMuted }}>{dp.year}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── NSERC Panel ────────────────────────────────────────────────────────────────

function NSERCPanel({ dark }: { dark?: boolean }) {
  const [data, setData] = useState<NSERCData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/nserc")
      .then((res) => res.json())
      .then((json) => { if (json.grants) setData(json) })
      .catch((err) => console.warn("[NSERCPanel] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SectionSkeleton title="NSERC AI Grants" variant="table" />

  if (!data || data.grants.length === 0) {
    return (
      <section>
        <div className="section-header"><h2>NSERC AI Grants</h2></div>
        <p className="text-sm" style={{ color: dark ? 'var(--text-on-invert-muted)' : 'var(--text-muted)' }}>Unable to load grant data.</p>
      </section>
    )
  }

  const textPrimary = dark ? 'var(--text-on-invert)' : 'var(--text-primary)'
  const textMuted = dark ? 'var(--text-on-invert-muted)' : 'var(--text-muted)'
  const textSecondary = dark ? 'var(--text-on-invert-secondary)' : 'var(--text-secondary)'

  const formatCurrency = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline" style={{ color: textPrimary }}>
          <span>NSERC AI Grants</span>
          <span className="text-sm font-medium" style={{ color: textMuted }}>{data.grantCount} grants tracked</span>
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: textSecondary }}>
        Discovery Grant awards for AI and machine learning research at Canadian universities. Total funding: {formatCurrency(data.totalFunding)}.
      </p>

      {/* Top Institutions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {data.topInstitutions.slice(0, 4).map((inst) => (
          <div key={inst.name} className="rounded-lg p-2.5" style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'var(--surface-secondary, rgba(0,0,0,0.02))' }}>
            <p className="text-xs font-bold truncate" style={{ color: textPrimary }}>{inst.name.replace(/University of |Université de /g, "U ")}</p>
            <p className="text-lg font-bold" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-display)' }}>{formatCurrency(inst.totalFunding)}</p>
            <p className="text-[10px]" style={{ color: textMuted }}>{inst.count} grants</p>
          </div>
        ))}
      </div>

      {/* Recent Grants Table */}
      <div className="flex flex-col gap-2">
        {data.grants.slice(0, 5).map((grant: NSERCGrant) => (
          <div key={grant.id} className="flex items-start gap-3 py-2" style={{ borderBottom: `1px solid ${dark ? 'var(--border-on-invert)' : 'var(--border-subtle)'}` }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: textPrimary }}>{grant.piName}</p>
              <p className="text-[10px] truncate" style={{ color: textMuted }}>{grant.institution}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(grant.amount)}</p>
              <p className="text-[10px]" style={{ color: textMuted }}>{grant.fiscalYear}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── University Programs Panel ──────────────────────────────────────────────────

function UniversityProgramsPanel({ dark, provinceFilter }: { dark?: boolean; provinceFilter?: string }) {
  const textPrimary = dark ? 'var(--text-on-invert)' : 'var(--text-primary)'
  const textMuted = dark ? 'var(--text-on-invert-muted)' : 'var(--text-muted)'
  const textSecondary = dark ? 'var(--text-on-invert-secondary)' : 'var(--text-secondary)'

  const programs = provinceFilter
    ? UNIVERSITY_PROGRAMS.filter((p) => p.provinceSlug === provinceFilter)
    : UNIVERSITY_PROGRAMS
  const stats = getProgramStats()

  const DEGREE_COLORS: Record<string, string> = {
    PhD: "bg-purple-50 text-purple-700 border-purple-200",
    MSc: "bg-blue-50 text-blue-700 border-blue-200",
    BSc: "bg-green-50 text-green-700 border-green-200",
    Certificate: "bg-amber-50 text-amber-700 border-amber-200",
    Diploma: "bg-slate-50 text-slate-600 border-slate-200",
  }

  // Group by institution
  const byInstitution = programs.reduce<Record<string, UniversityProgram[]>>((acc, p) => {
    if (!acc[p.institution]) acc[p.institution] = []
    acc[p.institution].push(p)
    return acc
  }, {})

  const institutions = Object.entries(byInstitution).slice(0, 8)

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline" style={{ color: textPrimary }}>
          <span>University AI Programs</span>
          <span className="text-sm font-medium" style={{ color: textMuted }}>
            {stats.total} programs at {stats.institutions} universities
          </span>
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: textSecondary }}>
        Graduate and undergraduate programs in AI, machine learning, and data science at Canadian universities.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {institutions.map(([name, progs]) => (
          <div key={name} className="rounded-lg p-3" style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'var(--surface-secondary, rgba(0,0,0,0.02))' }}>
            <p className="text-xs font-bold mb-1 truncate" style={{ color: textPrimary }}>{name}</p>
            <p className="text-[10px] mb-2" style={{ color: textMuted }}>{progs[0].province}</p>
            <div className="flex flex-wrap gap-1">
              {progs.map((p, i) => (
                <span key={i} className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${DEGREE_COLORS[p.degree] || DEGREE_COLORS.Diploma}`}>
                  {p.degree}
                </span>
              ))}
            </div>
            {progs[0].notable && (
              <p className="text-[10px] mt-2 leading-relaxed line-clamp-2" style={{ color: textMuted }}>{progs[0].notable}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Main Section ───────────────────────────────────────────────────────────────

export default function TalentEducationSection({ provinceFilter }: { provinceFilter?: string }) {
  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ImmigrationPanel dark />
        <NSERCPanel dark />
      </div>

      <div className="mt-4">
        <UniversityProgramsPanel dark provinceFilter={provinceFilter} />
      </div>
    </div>
  )
}
