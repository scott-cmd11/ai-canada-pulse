'use client';

import { useIntelData } from '@/components/use-intel-data';

export default function SourcesPage() {
  const { stats, loading, setQuery, setActiveSource } = useIntelData({ limit: 250 });

  return (
    <main className="relative z-10 mx-auto max-w-[1250px] space-y-4 px-4 py-6 md:px-8">
      <section className="panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Sources</p>
        <h1 className="text-2xl font-semibold">Source Registry And Reliability</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Full source inventory with parser type, cadence, and trust weighting.
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
            <h2 className="text-base font-semibold">Live Source Quality</h2>
            <div className="mt-3 space-y-2">
              {stats.sourceReliability.map((source) => (
                <button
                  key={source.name}
                  onClick={() => {
                    setQuery(source.name);
                    setActiveSource(source.name);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-left transition hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{source.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {source.count} items - {source.tier} tier
                    </p>
                  </div>
                  <div className="h-2 w-40 overflow-hidden rounded-full bg-black/20">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#3da8ff] to-[#2ce2b2]" style={{ width: `${source.score}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-[var(--muted)]">{source.score}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel p-4">
            <h2 className="text-base font-semibold">Source Registry</h2>
            <p className="mb-3 text-sm text-[var(--muted)]">Configured ingestion catalog with cadence and parser metadata.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Kind</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Cadence</th>
                    <th className="px-2 py-2">Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sourceRegistry.map((source) => (
                    <tr key={source.id} className="border-b border-[var(--line)]">
                      <td className="px-2 py-2">{source.name}</td>
                      <td className="px-2 py-2">{source.kind}</td>
                      <td className="px-2 py-2">{source.type}</td>
                      <td className="px-2 py-2">{source.cadenceMinutes}m</td>
                      <td className="px-2 py-2">{source.reliability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
