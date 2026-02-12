'use client';

import { useEffect, useMemo } from 'react';
import { useIntelData } from '@/components/use-intel-data';
import { StatsTicker } from '@/components/stats-ticker';
import { FilterBar } from '@/components/filter-bar';
import { NudgeBanner } from '@/components/nudge-banner';
import { SignalCard } from '@/components/signal-card';
import { IntelType } from '@/lib/types';

export default function FeedPage() {
  const {
    filteredItems,
    stats,
    loading,
    activeType,
    activeWatchlist,
    activeRegion,
    activeSource,
    query,
    setActiveType,
    setActiveWatchlist,
    setActiveRegion,
    setActiveSource,
    setQuery,
    runAction,
    postNote,
  } = useIntelData({ limit: 400 });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') as IntelType | null;
    const watchlist = params.get('watchlist');
    const region = params.get('region');
    const source = params.get('source');
    const q = params.get('q');

    if (type) setActiveType(type);
    if (watchlist) setActiveWatchlist(watchlist);
    if (region) setActiveRegion(region);
    if (source) setActiveSource(source);
    if (q) setQuery(q);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeType !== 'all') params.set('type', activeType);
    if (activeWatchlist !== 'all') params.set('watchlist', activeWatchlist);
    if (activeRegion !== 'all') params.set('region', activeRegion);
    if (activeSource !== 'all') params.set('source', activeSource);
    if (query.trim()) params.set('q', query.trim());
    const next = params.toString();
    const path = next ? `/?${next}` : '/';
    window.history.replaceState({}, '', path);
  }, [activeType, activeWatchlist, activeRegion, activeSource, query]);

  const regionOptions = useMemo(() => ['all', ...(stats?.regionalBreakdown.map((e) => e.region) || [])], [stats]);
  const sourceOptions = useMemo(() => ['all', ...(stats?.bySource.map((e) => e.name) || [])], [stats]);

  const handleSubscribe = (entity: string) => {
    runAction('subscribe-entity', { entity });
  };

  const handleAnnotate = (entity: string) => {
    const text = window.prompt('Add annotation');
    if (text) postNote('entity', entity, text);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="noise-layer" />
      <main className="relative z-10 mx-auto max-w-[1400px] space-y-3 px-4 py-4 md:px-8 md:py-6">
        <StatsTicker stats={stats} lastScan={stats?.lastScan} />
        <FilterBar
          activeType={activeType}
          activeWatchlist={activeWatchlist}
          activeRegion={activeRegion}
          activeSource={activeSource}
          query={query}
          regionOptions={regionOptions}
          sourceOptions={sourceOptions}
          onTypeChange={setActiveType}
          onWatchlistChange={setActiveWatchlist}
          onRegionChange={setActiveRegion}
          onSourceChange={setActiveSource}
          onQueryChange={setQuery}
        />
        <NudgeBanner nudges={stats?.nudges || []} />

        {loading ? (
          <p className="py-16 text-center text-sm text-[var(--muted)]">Loading signal feed...</p>
        ) : filteredItems.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--muted)]">No signals match current filters.</p>
        ) : (
          <div className="space-y-2">
            {filteredItems.slice(0, 100).map((item) => (
              <SignalCard
                key={item.id}
                item={item}
                onSubscribe={handleSubscribe}
                onAnnotate={handleAnnotate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
