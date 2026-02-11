'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardStats, IntelItem, IntelType, TimelinePoint } from '@/lib/types';

type TimelineMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

const TYPE_LABELS: Record<IntelType, { label: string; accent: string }> = {
  news: { label: 'News', accent: 'bg-sky-500' },
  research: { label: 'Research', accent: 'bg-cyan-500' },
  policy: { label: 'Policy', accent: 'bg-amber-500' },
  github: { label: 'GitHub', accent: 'bg-slate-500' },
  funding: { label: 'Funding', accent: 'bg-emerald-500' },
};

export default function Dashboard() {
  const [items, setItems] = useState<IntelItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeType, setActiveType] = useState<IntelType | 'all'>('all');
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('monthly');
  const [query, setQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const filter = activeType === 'all' ? '' : `type=${activeType}&`;
      const [intelRes, statsRes] = await Promise.all([
        fetch(`/api/intel?${filter}limit=250`),
        fetch('/api/stats'),
      ]);

      const intelData = await intelRes.json();
      const statsData = await statsRes.json();

      if (intelData.success) setItems(intelData.items);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runScan = async () => {
    setScanning(true);
    try {
      const response = await fetch('/api/scan', { method: 'POST' });
      const data = await response.json();
      if (data.success) await fetchData();
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;

    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.source.toLowerCase().includes(lower) ||
        item.entities.some((entity) => entity.toLowerCase().includes(lower)),
    );
  }, [items, query]);

  const timelinePoints: TimelinePoint[] = useMemo(() => {
    if (!stats) return [];
    return stats.timeline[timelineMode];
  }, [stats, timelineMode]);

  const maxTimelineCount = Math.max(...timelinePoints.map((point) => point.count), 1);

  const formatRelative = (dateRaw: string) => {
    const date = new Date(dateRaw);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-white/10 bg-[var(--panel)]/85 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">AI Canada Pulse</p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight sm:text-4xl">
              Live Intelligence Dashboard For Canada AI
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Multi-source tracking across news, policy, research, GitHub, and funding since November 30, 2022.
            </p>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            className="rounded-xl border border-[var(--line)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {scanning ? 'Scanning' : 'Scan Now'}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Total" value={stats?.totalItems || 0} />
          <MetricCard label="Today" value={stats?.itemsToday || 0} />
          <MetricCard label="This Week" value={stats?.itemsThisWeek || 0} />
          <MetricCard label="This Month" value={stats?.itemsThisMonth || 0} />
          <MetricCard label="This Year" value={stats?.itemsThisYear || 0} />
        </section>

        <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <FilterButton active={activeType === 'all'} onClick={() => setActiveType('all')}>
                All Types
              </FilterButton>
              {Object.entries(TYPE_LABELS).map(([type, config]) => (
                <FilterButton
                  key={type}
                  active={activeType === type}
                  onClick={() => setActiveType(type as IntelType)}
                >
                  {config.label}
                </FilterButton>
              ))}
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search entities, topics, and sources"
              className="w-full rounded-lg border border-[var(--line)] bg-black/20 px-3 py-2 text-sm text-white outline-none ring-[var(--accent)]/30 transition focus:ring sm:max-w-sm"
            />
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Activity Timeline</h2>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly', 'yearly'] as TimelineMode[]).map((mode) => (
                  <FilterButton key={mode} active={timelineMode === mode} onClick={() => setTimelineMode(mode)}>
                    {mode}
                  </FilterButton>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {timelinePoints.map((point) => (
                <div key={point.label} className="grid grid-cols-[1fr_4fr_auto] items-center gap-3">
                  <span className="truncate text-xs text-[var(--muted)]">{point.label}</span>
                  <div className="h-2 rounded-full bg-black/30">
                    <div
                      className="h-2 rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.max((point.count / maxTimelineCount) * 100, point.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted)]">{point.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">By Type</h3>
              <div className="space-y-2">
                {Object.entries(TYPE_LABELS).map(([type, config]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${config.accent}`} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <span className="text-sm text-[var(--muted)]">{stats?.byType[type as IntelType] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Top Sources</h3>
              <div className="space-y-2">
                {(stats?.bySource || []).slice(0, 8).map((source) => (
                  <button
                    key={source.name}
                    onClick={() => setQuery(source.name)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-sm transition hover:bg-white/5"
                  >
                    <span className="truncate">{source.name}</span>
                    <span className="text-[var(--muted)]">{source.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Top Entities</h3>
              <div className="flex flex-wrap gap-2">
                {(stats?.topEntities || []).slice(0, 12).map((entity) => (
                  <button
                    key={entity.name}
                    onClick={() => setQuery(entity.name)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs transition hover:bg-white/10"
                  >
                    {entity.name} ({entity.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Feed</h2>
            <span className="text-xs text-[var(--muted)]">
              Last scan: {stats?.lastScan && stats.lastScan !== 'Never' ? formatRelative(stats.lastScan) : 'never'}
            </span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-[var(--muted)]">Loading intelligence feed...</p>
          ) : filteredItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--muted)]">No items yet. Run scan to populate.</p>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <article key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span className={`rounded-full px-2 py-0.5 text-black ${TYPE_LABELS[item.type].accent}`}>
                      {TYPE_LABELS[item.type].label}
                    </span>
                    <span>{item.source}</span>
                    <span>{formatRelative(item.publishedAt)}</span>
                    <span>Relevance {item.relevanceScore.toFixed(1)}</span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-base font-semibold transition hover:text-[var(--accent)]"
                  >
                    {item.title}
                  </a>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.entities.map((entity) => (
                      <button
                        key={`${item.id}-${entity}`}
                        onClick={() => setQuery(entity)}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-[var(--muted)] hover:bg-white/5"
                      >
                        {entity}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function MetricCard(props: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold">{props.value}</p>
    </div>
  );
}

function FilterButton(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition ${
        props.active
          ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
          : 'border-white/10 bg-white/5 text-[var(--muted)] hover:bg-white/10'
      }`}
    >
      {props.children}
    </button>
  );
}
