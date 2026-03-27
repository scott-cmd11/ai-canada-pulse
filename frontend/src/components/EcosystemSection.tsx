"use client"

import { useState, useEffect, useMemo } from "react"
import { STARTUPS, getStartupStats, type CanadianStartup, type StartupSector } from "@/lib/startups-data"
import type { StartupSignalsData, StartupSignal } from "@/lib/startup-signals-client"
import { getUpcomingEvents, type AIEvent } from "@/lib/events-data"

// ─── Startup Map Panel ──────────────────────────────────────────────────────────

function StartupMapPanel({ provinceFilter }: { provinceFilter?: string }) {
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

  const STAGE_COLORS: Record<string, string> = {
    Seed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Series A": "bg-blue-50 text-blue-700 border-blue-200",
    "Series B": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Series C": "bg-purple-50 text-purple-700 border-purple-200",
    "Series D+": "bg-violet-50 text-violet-700 border-violet-200",
    Public: "bg-amber-50 text-amber-700 border-amber-200",
    Acquired: "bg-slate-50 text-slate-600 border-slate-200",
    Growth: "bg-teal-50 text-teal-700 border-teal-200",
  }

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
        {startups.slice(0, 8).map((startup: CanadianStartup) => (
          <div key={startup.name} className="saas-card p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <a
                href={startup.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold hover:underline truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {startup.name}
              </a>
              <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border shrink-0 ${STAGE_COLORS[startup.stage] || STAGE_COLORS.Growth}`}>
                {startup.stage}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
              <span>{startup.city}, {startup.province}</span>
              <span style={{ color: 'var(--border-subtle)' }}>•</span>
              <span>Est. {startup.foundedYear}</span>
            </div>
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {startup.description}
            </p>
            <div className="mt-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)', color: 'var(--accent-primary)' }}>
                {startup.sector}
              </span>
            </div>
          </div>
        ))}
      </div>

      {startups.length > 8 && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          +{startups.length - 8} more companies
        </p>
      )}
    </section>
  )
}

// ─── Startup Signals Panel ──────────────────────────────────────────────────────

function StartupSignalsPanel() {
  const [data, setData] = useState<StartupSignalsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/startups")
      .then((res) => res.json())
      .then((json) => { if (json.signals) setData(json) })
      .catch((err) => console.warn("[StartupSignalsPanel] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  const SIGNAL_ICONS: Record<string, string> = {
    Funding: "💰",
    Acquisition: "🤝",
    "Product Launch": "🚀",
    Partnership: "🔗",
    Expansion: "📈",
    IPO: "📊",
  }

  const SIGNAL_COLORS: Record<string, string> = {
    Funding: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Acquisition: "bg-purple-50 text-purple-700 border-purple-200",
    "Product Launch": "bg-blue-50 text-blue-700 border-blue-200",
    Partnership: "bg-amber-50 text-amber-700 border-amber-200",
    Expansion: "bg-teal-50 text-teal-700 border-teal-200",
    IPO: "bg-indigo-50 text-indigo-700 border-indigo-200",
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>Funding & Startup Signals</span>
          {!loading && data && (
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {data.totalSignals} signals
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

      {!loading && (!data || data.signals.length === 0) && (
        <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No recent startup signals detected.</p>
      )}

      {!loading && data && data.signals.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {data.signals.slice(0, 6).map((signal: StartupSignal) => (
            <div key={signal.id} className="saas-card p-3">
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">{SIGNAL_ICONS[signal.signalType] || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{signal.companyName}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${SIGNAL_COLORS[signal.signalType] || ""}`}>
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

// ─── Events Panel ───────────────────────────────────────────────────────────────

function EventsPanel({ provinceFilter }: { provinceFilter?: string }) {
  const events: AIEvent[] = useMemo(() => {
    const upcoming = getUpcomingEvents()
    return provinceFilter ? upcoming.filter((e) => e.provinceSlug === provinceFilter) : upcoming
  }, [provinceFilter])

  const TYPE_COLORS: Record<string, string> = {
    Conference: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Seminar: "bg-blue-50 text-blue-700 border-blue-200",
    Workshop: "bg-teal-50 text-teal-700 border-teal-200",
    Meetup: "bg-green-50 text-green-700 border-green-200",
    "Public Consultation": "bg-amber-50 text-amber-700 border-amber-200",
    Hackathon: "bg-purple-50 text-purple-700 border-purple-200",
    Summit: "bg-rose-50 text-rose-700 border-rose-200",
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })
    } catch {
      return d
    }
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="flex justify-between items-baseline">
          <span>AI Events & Community</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {events.length} upcoming
          </span>
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Conferences, meetups, and public consultations across Canada.
      </p>

      {events.length === 0 && (
        <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No upcoming events found.</p>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {events.slice(0, 6).map((event) => (
          <div key={event.id} className="saas-card p-3">
            <div className="flex items-start gap-3">
              <div className="text-center shrink-0 w-12 rounded-lg p-1.5" style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' }}>
                <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--accent-primary)' }}>
                  {formatDate(event.date).split(" ")[0]}
                </p>
                <p className="text-lg font-bold leading-none" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-display)' }}>
                  {formatDate(event.date).split(" ")[1]}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold hover:underline line-clamp-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {event.name}
                </a>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{event.city}, {event.province}</span>
                  {event.recurring && (
                    <>
                      <span style={{ color: 'var(--border-subtle)' }}>•</span>
                      <span>Recurring</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${TYPE_COLORS[event.type] || ""}`}>
                    {event.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Main Section ───────────────────────────────────────────────────────────────

export default function EcosystemSection({ provinceFilter }: { provinceFilter?: string }) {
  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-2">
        <StartupMapPanel provinceFilter={provinceFilter} />
        <StartupSignalsPanel />
      </div>

      <div className="mt-4">
        <EventsPanel provinceFilter={provinceFilter} />
      </div>
    </div>
  )
}
