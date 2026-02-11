'use client';

import { useMemo } from 'react';
import { useIntelData } from '@/components/use-intel-data';
import { IntelType, WATCHLISTS } from '@/lib/types';

const TYPES: Array<IntelType | 'all'> = ['all', 'news', 'research', 'policy', 'funding', 'github'];

export default function SignalsPage() {
  const {
    filteredItems,
    loading,
    activeType,
    setActiveType,
    activeWatchlist,
    setActiveWatchlist,
    query,
    setQuery,
  } = useIntelData({ limit: 700 });

  const topResults = useMemo(() => filteredItems.slice(0, 150), [filteredItems]);

  return (
    <main className="relative z-10 mx-auto max-w-[1300px] space-y-4 px-4 py-6 md:px-8">
      <section className="panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Signals Explorer</p>
        <h1 className="text-2xl font-semibold">Deep Dive Intelligence Feed</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Search, segment, and review raw signals across all tracked AI channels in Canada.
        </p>
      </section>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          {TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition ${
                activeType === type
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:bg-white'
              }`}
            >
              {type}
            </button>
          ))}
          <select
            value={activeWatchlist}
            onChange={(event) => setActiveWatchlist(event.target.value)}
            className="ml-auto rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
          >
            <option value="all">All Watchlists</option>
            {WATCHLISTS.map((watch) => (
              <option key={watch.id} value={watch.id}>
                {watch.name}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, entity, source"
            className="min-w-[260px] rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none ring-[var(--accent)]/30 transition focus:ring"
          />
        </div>
      </section>

      <section className="panel p-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Loading signals...</p>
        ) : topResults.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">No matching signals.</p>
        ) : (
          <div className="space-y-2">
              {topResults.map((item) => (
                <article key={item.id} className="rounded-lg border border-[var(--line)] bg-white/70 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5">{item.type}</span>
                  <span>{item.source}</span>
                  <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                  <span>rel {item.relevanceScore.toFixed(1)}</span>
                </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm font-semibold hover:text-[var(--accent)]">
                    {item.title}
                  </a>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.description}</p>
                  <div className="mt-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white"
                    >
                      Open Source
                    </a>
                  </div>
                </article>
              ))}
            </div>
        )}
      </section>
    </main>
  );
}


