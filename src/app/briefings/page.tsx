'use client';

import { useIntelData } from '@/components/use-intel-data';

export default function BriefingsPage() {
  const { stats, loading, runScan, scanning } = useIntelData({ limit: 120 });

  return (
    <main className="relative z-10 mx-auto max-w-[1200px] space-y-4 px-4 py-6 md:px-8">
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Briefings</p>
            <h1 className="text-2xl font-semibold">Executive AI Briefing Center</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Daily, weekly, and monthly strategic summaries generated from live Canada AI signals.
            </p>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            className="rounded-xl border border-[var(--line)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
          >
            {scanning ? 'Scanning...' : 'Refresh Signals'}
          </button>
        </div>
      </section>

      {loading || !stats ? (
        <section className="panel p-8 text-center text-sm text-[var(--muted)]">Loading briefings...</section>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            {[stats.briefings.daily, stats.briefings.weekly, stats.briefings.monthly].map((brief) => (
              <article key={brief.window} className="panel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{brief.window}</p>
                <h2 className="mt-1 text-lg font-semibold">{brief.headline}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{brief.summary}</p>
                <ul className="mt-3 space-y-1">
                  {brief.bullets.map((bullet) => (
                    <li key={bullet} className="text-xs text-[var(--muted)]">
                      • {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="panel p-4">
            <h3 className="text-base font-semibold">Top Storylines</h3>
            <p className="mb-3 text-sm text-[var(--muted)]">
              Event clusters with strongest multi-source convergence across the last month.
            </p>
            <div className="space-y-2">
              {stats.eventClusters.slice(0, 8).map((cluster) => (
                <article key={cluster.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm font-semibold">{cluster.headline}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {cluster.itemCount} items • {cluster.sources.length} sources • score {cluster.score.toFixed(1)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
