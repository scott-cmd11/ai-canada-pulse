'use client';

import { useIntelData } from '@/components/use-intel-data';

export default function SourcesPage() {
  const { stats, loading, setQuery } = useIntelData({ limit: 200 });

  return (
    <main className="relative z-10 mx-auto max-w-[1200px] space-y-4 px-4 py-6 md:px-8">
      <section className="panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Sources</p>
        <h1 className="text-2xl font-semibold">Source Quality And Coverage</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Reliability-weighted source intelligence with concentration and trust visibility.
        </p>
      </section>

      {loading || !stats ? (
        <section className="panel p-8 text-center text-sm text-[var(--muted)]">Loading source matrix...</section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Metric label="Avg Reliability" value={stats.quality.avgReliability.toFixed(1)} />
            <Metric label="Source Diversity" value={String(stats.quality.sourceDiversity)} />
            <Metric label="Signal Mix H/M/L" value={`${stats.signalMix.high}/${stats.signalMix.medium}/${stats.signalMix.low}`} />
          </section>

          <section className="panel p-4">
            <div className="space-y-2">
              {stats.sourceReliability.map((source) => (
                <button
                  key={source.name}
                  onClick={() => setQuery(source.name)}
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-left transition hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{source.name}</p>
                    <p className="text-xs text-[var(--muted)]">{source.count} items â€¢ {source.tier} tier</p>
                  </div>
                  <div className="h-2 w-40 overflow-hidden rounded-full bg-black/30">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#3da8ff] to-[#2ce2b2]" style={{ width: `${source.score}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-[var(--muted)]">{source.score}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold">{props.value}</p>
    </div>
  );
}


