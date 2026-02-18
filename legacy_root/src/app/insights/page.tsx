'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIntelData } from '@/components/use-intel-data';
import { InsightTabs, type InsightTab } from '@/components/insight-tabs';
import { BriefingPanel } from '@/components/briefing-panel';
import { ClusterCard } from '@/components/cluster-card';
import { LineChart } from '@/components/line-chart';
import { MiniBars } from '@/components/mini-bars';
import { MomentumList } from '@/components/momentum-list';
import { SourceTable } from '@/components/source-table';
import { WatchlistCard } from '@/components/watchlist-card';
import { Chip } from '@/components/chip';
import { WATCHLISTS, type TimelinePoint } from '@/lib/types';

type TimelineMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function InsightsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)] p-8 text-center text-sm text-[var(--muted)]">Loading insights...</div>}>
      <InsightsContent />
    </Suspense>
  );
}

function InsightsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as InsightTab) || 'briefings';
  const [activeTab, setActiveTab] = useState<InsightTab>(initialTab);
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('monthly');

  const { stats, loading, runAction, postNote, setQuery } = useIntelData({ limit: 100 });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    window.history.replaceState({}, '', `/insights?${params.toString()}`);
  }, [activeTab]);

  const timelinePoints: TimelinePoint[] = useMemo(
    () => (stats ? stats.timeline[timelineMode] : []),
    [stats, timelineMode],
  );

  const avgTimeline = useMemo(() => {
    if (!timelinePoints.length) return 0;
    return Math.round(timelinePoints.reduce((sum, p) => sum + p.count, 0) / timelinePoints.length);
  }, [timelinePoints]);

  const watchById = useMemo(() => {
    const map = new Map<string, (typeof stats)extends null ? never : NonNullable<typeof stats>['watchlists'][number]>();
    stats?.watchlists.forEach((w) => map.set(w.id, w));
    return map;
  }, [stats]);

  const handleClusterNote = (clusterId: string) => {
    const text = window.prompt('Add annotation');
    if (text) postNote('cluster', clusterId, text);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="noise-layer" />
      <main className="relative z-10 mx-auto max-w-[1300px] space-y-4 px-4 py-4 md:px-8 md:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Insights</p>
            <h1 className="text-2xl font-semibold">Intelligence Analysis</h1>
          </div>
          <InsightTabs active={activeTab} onChange={setActiveTab} />
        </div>

        {loading || !stats ? (
          <div className="panel p-8 text-center text-sm text-[var(--muted)]">Loading insights...</div>
        ) : (
          <>
            {activeTab === 'briefings' && (
              <section className="panel p-5">
                <BriefingPanel stats={stats} onExport={() => runAction('export-briefing')} />
              </section>
            )}

            {activeTab === 'storylines' && (
              <section className="panel p-5">
                <h2 className="type-title mb-4">Event Clusters</h2>
                <p className="mb-4 text-sm text-[var(--muted)]">Semantic storyline clusters with multi-source convergence.</p>
                <div className="grid gap-3 lg:grid-cols-2">
                  {stats.eventClusters.slice(0, 12).map((cluster) => (
                    <ClusterCard
                      key={cluster.id}
                      cluster={cluster}
                      onNote={() => handleClusterNote(cluster.id)}
                      onCreateWatchlist={() => runAction('create-watchlist-from-cluster', { clusterId: cluster.id })}
                    />
                  ))}
                </div>
                {stats.eventClusters.length === 0 && (
                  <p className="py-8 text-center text-sm text-[var(--muted)]">No event clusters yet.</p>
                )}
              </section>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-4">
                <section className="panel p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="type-title">Signal Velocity</h2>
                      <p className="text-sm text-[var(--muted)]">Volume trend over time.</p>
                    </div>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly', 'yearly'] as TimelineMode[]).map((mode) => (
                        <Chip key={mode} active={timelineMode === mode} onClick={() => setTimelineMode(mode)} label={mode} />
                      ))}
                    </div>
                  </div>
                  <LineChart points={timelinePoints} />
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniMetric label="Window Avg" value={avgTimeline} />
                    <MiniMetric label="Peak" value={Math.max(...timelinePoints.map((p) => p.count), 0)} />
                    <MiniMetric label="Policy 7d" value={stats.regulatory.mentions7d} />
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                  <div className="panel p-5">
                    <h3 className="type-title mb-3">Regulatory Thermometer</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Score {stats.regulatory.score} - Level: {stats.regulatory.level}
                    </p>
                    <MiniBars points={stats.regulatory.timeline} />
                  </div>
                  <div className="panel p-5">
                    <h3 className="type-title mb-3">Momentum Movers</h3>
                    <p className="mb-3 text-sm text-[var(--muted)]">Entity mention velocity vs prior period.</p>
                    <MomentumList items={stats.momentum} onSelect={(name) => setQuery(name)} />
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'sources' && (
              <section className="panel p-5">
                <SourceTable stats={stats} />
              </section>
            )}

            {activeTab === 'watchlists' && (
              <section className="grid gap-4 lg:grid-cols-2">
                {WATCHLISTS.map((watch) => (
                  <WatchlistCard
                    key={watch.id}
                    definition={watch}
                    snapshot={watchById.get(watch.id)}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function MiniMetric(props: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{props.label}</p>
      <p className="type-title mt-1">{props.value}</p>
    </div>
  );
}
