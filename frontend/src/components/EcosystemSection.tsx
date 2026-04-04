"use client"

import { useState, useEffect, useMemo } from "react"
import { STARTUPS, getStartupStats, type CanadianStartup, type StartupSector } from "@/lib/startups-data"
import type { StartupSignalsData, StartupSignal } from "@/lib/startup-signals-client"

// ─── Startup Map Panel ──────────────────────────────────────────────────────────

function StartupMapPanel({ provinceFilter, liveSignals }: { provinceFilter?: string; liveSignals: StartupSignal[] }) {
  const [sectorFilter, setSectorFilter] = useState<StartupSector | "All">("All")

  const startups = useMemo(() => {
    let filtered = provinceFilter ? STARTUPS.filter((s) => s.provinceSlug === provinceFilter) : STARTUPS
    if (sectorFilter !== "All") filtered = filtered.filter((s) => s.sector === sectorFilter)
    return filtered
  }, [provinceFilter, sectorFilter])

  const stats = getStartupStats()
  const topSectors = Object.entries(stats.bySector)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  // Build a map of company name → most recent live signal
  const signalByCompany = useMemo(() => {
    const map = new Map<string, StartupSignal>()
    for (const signal of liveSignals) {
      const key = signal.companyName.toLowerCase()
      if (!map.has(key)) map.set(key, signal) // already sorted newest-first
    }
    return map
  }, [liveSignals])

  const STAGE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    Seed: { bg: 'color-mix(in srgb, #10b981 12%, var(--surface-primary))', color: '#10b981', border: '1px solid color-mix(in srgb, #10b981 20%, var(--surface-primary))' },
    "Series A": { bg: 'color-mix(in srgb, #3b82f6 12%, var(--surface-primary))', color: '#3b82f6', border: '1px solid color-mix(in srgb, #3b82f6 20%, var(--surface-primary))' },
    "Series B": { bg: 'color-mix(in srgb, #6366f1 12%, var(--surface-primary))', color: '#6366f1', border: '1px solid color-mix(in srgb, #6366f1 20%, var(--surface-primary))' },
    "Series C": { bg: 'color-mix(in srgb, #8b5cf6 12%, var(--surface-primary))', color: '#8b5cf6', border: '1px solid color-mix(in srgb, #8b5cf6 20%, var(--surface-primary))' },
    "Series D+": { bg: 'color-mix(in srgb, #7c3aed 12%, var(--surface-primary))', color: '#7c3aed', border: '1px solid color-mix(in srgb, #7c3aed 20%, var(--surface-primary))' },
    Public: { bg: 'color-mix(in srgb, #f59e0b 12%, var(--surface-primary))', color: '#f59e0b', border: '1px solid color-mix(in srgb, #f59e0b 20%, var(--surface-primary))' },
    Acquired: { bg: 'color-mix(in srgb, #64748b 12%, var(--surface-primary))', color: '#64748b', border: '1px solid color-mix(in srgb, #64748b 20%, var(--surface-primary))' },
    Growth: { bg: 'color-mix(in srgb, #14b8a6 12%, var(--surface-primary))', color: '#14b8a6', border: '1px solid color-mix(in srgb, #14b8a6 20%, var(--surface-primary))' },
  }

  // Most recent lastVerified date across all startups
  const lastVerified = STARTUPS.reduce((latest, s) => s.lastVerified > latest ? s.lastVerified : latest, "")
  const lastVerifiedFormatted = lastVerified
    ? new Date(lastVerified + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })
    : null

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>Canadian AI Startups</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {stats.total} companies tracked
          </span>
        </h2>
      </div>
      <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Notable AI companies across Canada, from early-stage startups to public companies.
        Cards marked <span className="font-semibold" style={{ color: '#16a34a' }}>Live</span> have recent news signals.
      </p>

      {/* Sector Filter Chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setSectorFilter("All")}
          className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border transition-colors"
          style={{
            background: sectorFilter === "All" ? 'var(--accent-primary)' : 'transparent',
            color: sectorFilter === "All" ? 'white' : 'var(--text-muted)',
            borderColor: sectorFilter === "All" ? 'var(--accent-primary)' : 'var(--border-subtle)',
          }}
        >
          All ({stats.total})
        </button>
        {topSectors.map(([sector, count]) => (
          <button
            key={sector}
            onClick={() => setSectorFilter(sector as StartupSector)}
            className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border transition-colors"
            style={{
              background: sectorFilter === sector ? 'var(--accent-primary)' : 'transparent',
              color: sectorFilter === sector ? 'white' : 'var(--text-muted)',
              borderColor: sectorFilter === sector ? 'var(--accent-primary)' : 'var(--border-subtle)',
            }}
          >
            {sector} ({count})
          </button>
        ))}
      </div>

      {/* Startup Grid */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {startups.slice(0, 8).map((startup: CanadianStartup) => {
          const liveSignal = signalByCompany.get(startup.name.toLowerCase())
          return (
            <div
              key={startup.name}
              className="saas-card p-3"
              style={{
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                borderColor: liveSignal ? 'color-mix(in srgb, #16a34a 30%, var(--border-subtle))' : undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = 'var(--accent-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = ''
                e.currentTarget.style.borderColor = liveSignal ? 'color-mix(in srgb, #16a34a 30%, var(--border-subtle))' : ''
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <a
                    href={startup.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold hover:underline focus-visible:underline focus-visible:outline-none truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {startup.name}
                  </a>
                  {liveSignal && (
                    <span
                      className="shrink-0 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: 'color-mix(in srgb, #16a34a 12%, var(--surface-primary))', color: '#15803d', border: '1px solid color-mix(in srgb, #16a34a 25%, var(--surface-primary))' }}
                    >
                      Live
                    </span>
                  )}
                </div>
                <span
                  className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded shrink-0"
                  style={{
                    backgroundColor: (STAGE_COLORS[startup.stage] || STAGE_COLORS.Growth).bg,
                    color: (STAGE_COLORS[startup.stage] || STAGE_COLORS.Growth).color,
                    border: (STAGE_COLORS[startup.stage] || STAGE_COLORS.Growth).border,
                  }}
                >
                  {startup.stage}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>{startup.city}, {startup.province}</span>
                <span style={{ color: 'var(--border-subtle)' }}>•</span>
                <span>Est. {startup.foundedYear}</span>
                {startup.totalFunding && (
                  <>
                    <span style={{ color: 'var(--border-subtle)' }}>•</span>
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>{startup.totalFunding}</span>
                  </>
                )}
              </div>

              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {startup.description}
              </p>

              {/* Live signal strip */}
              {liveSignal && (
                <a
                  href={liveSignal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-2 pt-2 text-[10px] hover:underline"
                  style={{ borderTop: '1px solid color-mix(in srgb, #16a34a 20%, var(--border-subtle))', color: '#15803d' }}
                >
                  <span className="font-semibold uppercase tracking-wider">{liveSignal.signalType}</span>
                  {liveSignal.amount && <span className="font-bold">{liveSignal.amount}</span>}
                  <span className="truncate" style={{ color: 'var(--text-muted)' }}>— {liveSignal.headline}</span>
                </a>
              )}

              {!liveSignal && (
                <div className="mt-1.5">
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)', color: 'var(--accent-primary)' }}>
                    {startup.sector}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {startups.length > 8 && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          +{startups.length - 8} more companies
        </p>
      )}

      {lastVerifiedFormatted && (
        <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
          Directory last verified {lastVerifiedFormatted} · Sources: Crunchbase, BetaKit, company websites
        </p>
      )}
    </section>
  )
}

// ─── Startup Signals Panel ──────────────────────────────────────────────────────

function StartupSignalsPanel({ signals, loading }: { signals: StartupSignal[]; loading: boolean }) {
  const SIGNAL_ICONS: Record<string, string> = {
    Funding: "💰",
    Acquisition: "🤝",
    "Product Launch": "🚀",
    Partnership: "🔗",
    Expansion: "📈",
    IPO: "📊",
  }

  const SIGNAL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    Funding: { bg: 'color-mix(in srgb, #10b981 12%, var(--surface-primary))', color: '#10b981', border: '1px solid color-mix(in srgb, #10b981 20%, var(--surface-primary))' },
    Acquisition: { bg: 'color-mix(in srgb, #8b5cf6 12%, var(--surface-primary))', color: '#8b5cf6', border: '1px solid color-mix(in srgb, #8b5cf6 20%, var(--surface-primary))' },
    "Product Launch": { bg: 'color-mix(in srgb, #3b82f6 12%, var(--surface-primary))', color: '#3b82f6', border: '1px solid color-mix(in srgb, #3b82f6 20%, var(--surface-primary))' },
    Partnership: { bg: 'color-mix(in srgb, #f59e0b 12%, var(--surface-primary))', color: '#f59e0b', border: '1px solid color-mix(in srgb, #f59e0b 20%, var(--surface-primary))' },
    Expansion: { bg: 'color-mix(in srgb, #14b8a6 12%, var(--surface-primary))', color: '#14b8a6', border: '1px solid color-mix(in srgb, #14b8a6 20%, var(--surface-primary))' },
    IPO: { bg: 'color-mix(in srgb, #6366f1 12%, var(--surface-primary))', color: '#6366f1', border: '1px solid color-mix(in srgb, #6366f1 20%, var(--surface-primary))' },
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>Funding & Startup Signals</span>
          {!loading && signals.length > 0 && (
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {signals.length} signals
            </span>
          )}
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Funding rounds, acquisitions, and product launches extracted from Canadian AI news.
      </p>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg h-16" style={{ background: 'var(--border-subtle)', opacity: 0.4 }} />
          ))}
        </div>
      )}

      {!loading && signals.length === 0 && (
        <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No recent startup signals detected.</p>
      )}

      {!loading && signals.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {signals.slice(0, 6).map((signal: StartupSignal) => (
            <div
              key={signal.id}
              className="saas-card p-3"
              style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = 'var(--accent-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = ''
                e.currentTarget.style.borderColor = ''
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">{SIGNAL_ICONS[signal.signalType] || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{signal.companyName}</span>
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded"
                      style={SIGNAL_COLORS[signal.signalType] ? {
                        backgroundColor: SIGNAL_COLORS[signal.signalType].bg,
                        color: SIGNAL_COLORS[signal.signalType].color,
                        border: SIGNAL_COLORS[signal.signalType].border,
                      } : {
                        backgroundColor: 'color-mix(in srgb, var(--text-muted) 12%, var(--surface-primary))',
                        color: 'var(--text-muted)',
                        border: '1px solid color-mix(in srgb, var(--text-muted) 20%, var(--surface-primary))',
                      }}
                    >
                      {signal.signalType}
                    </span>
                    {signal.amount && (
                      <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{signal.amount}</span>
                    )}
                  </div>
                  <a
                    href={signal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs leading-relaxed hover:underline line-clamp-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {signal.headline}
                  </a>
                  <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span>{signal.source}</span>
                    <span style={{ color: 'var(--border-subtle)' }}>•</span>
                    <span>{signal.date}</span>
                    {signal.province && (
                      <>
                        <span style={{ color: 'var(--border-subtle)' }}>•</span>
                        <span>{signal.province}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Main Section ───────────────────────────────────────────────────────────────

export default function EcosystemSection({ provinceFilter }: { provinceFilter?: string }) {
  const [signals, setSignals] = useState<StartupSignal[]>([])
  const [signalsLoading, setSignalsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/startups")
      .then((res) => res.json())
      .then((json: StartupSignalsData) => { if (json.signals) setSignals(json.signals) })
      .catch((err) => console.warn("[EcosystemSection] fetch failed:", err))
      .finally(() => setSignalsLoading(false))
  }, [])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <StartupMapPanel provinceFilter={provinceFilter} liveSignals={signals} />
      <StartupSignalsPanel signals={signals} loading={signalsLoading} />
    </div>
  )
}
