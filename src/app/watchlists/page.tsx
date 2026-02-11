'use client';

import { useMemo } from 'react';
import { useIntelData } from '@/components/use-intel-data';
import { WATCHLISTS, WatchlistSnapshot } from '@/lib/types';

export default function WatchlistsPage() {
  const { stats, loading, setActiveWatchlist, setQuery } = useIntelData({ limit: 350 });

  const watchById = useMemo(() => {
    const map = new Map<string, WatchlistSnapshot>();
    stats?.watchlists.forEach((watch) => map.set(watch.id, watch));
    return map;
  }, [stats]);

  return (
    <main className="relative z-10 mx-auto max-w-[1300px] space-y-4 px-4 py-6 md:px-8">
      <section className="panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Watchlists</p>
        <h1 className="text-2xl font-semibold">Strategic Monitoring Tracks</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Curated monitoring lanes for foundation models, policy, startup capital, and healthcare AI.
        </p>
      </section>

      {loading || !stats ? (
        <section className="panel p-8 text-center text-sm text-[var(--muted)]">Loading watchlists...</section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {WATCHLISTS.map((watch) => {
            const snapshot = watchById.get(watch.id);
            return (
              <article key={watch.id} className="panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{watch.name}</h2>
                  <button
                    onClick={() => setActiveWatchlist(watch.id)}
                    className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white"
                  >
                    Filter Feed
                  </button>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{watch.description}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {snapshot?.count || 0} items this week â€¢ {snapshot?.deltaPercent || 0}% delta
                </p>
                <div className="mt-3 space-y-2">
                  {(snapshot?.topItems || []).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setQuery(item.title)}
                      className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-left transition hover:bg-white"
                    >
                      <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{item.source}</p>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}


