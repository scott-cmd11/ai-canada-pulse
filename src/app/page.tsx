'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefing,
  DashboardStats,
  EventCluster,
  IntelItem,
  IntelType,
  MomentumItem,
  TimelinePoint,
  TrendDirection,
  WATCHLISTS,
} from '@/lib/types';

type TimelineMode = 'daily' | 'weekly' | 'monthly' | 'yearly';
type BriefMode = 'daily' | 'weekly' | 'monthly';

const TYPE_META: Record<IntelType, { label: string; color: string }> = {
  news: { label: 'News', color: '#3da8ff' },
  research: { label: 'Research', color: '#35d6c9' },
  policy: { label: 'Policy', color: '#f4b645' },
  github: { label: 'GitHub', color: '#9aa4b8' },
  funding: { label: 'Funding', color: '#2ce2b2' },
};

export default function Dashboard() {
  const [items, setItems] = useState<IntelItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const [activeType, setActiveType] = useState<IntelType | 'all'>('all');
  const [activeWatchlist, setActiveWatchlist] = useState<string>('all');
  const [query, setQuery] = useState('');

  const [timelineMode, setTimelineMode] = useState<TimelineMode>('monthly');
  const [briefMode, setBriefMode] = useState<BriefMode>('weekly');

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '400');
      if (activeType !== 'all') params.set('type', activeType);
      if (activeWatchlist !== 'all') params.set('watchlist', activeWatchlist);

      const [intelRes, statsRes] = await Promise.all([fetch(`/api/intel?${params.toString()}`), fetch('/api/stats')]);

      const intelData = await intelRes.json();
      const statsData = await statsRes.json();

      if (intelData.success) setItems(intelData.items);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeType, activeWatchlist]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
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
    return items.filter((item) => {
      const fullText = `${item.title} ${item.description} ${item.source} ${item.entities.join(' ')}`.toLowerCase();
      return fullText.includes(lower);
    });
  }, [items, query]);

  const timelinePoints: TimelinePoint[] = useMemo(() => {
    if (!stats) return [];
    return stats.timeline[timelineMode];
  }, [stats, timelineMode]);

  const activeBrief: Briefing | null = useMemo(() => {
    if (!stats) return null;
    return stats.briefings[briefMode];
  }, [stats, briefMode]);

  const avgTimeline = useMemo(() => {
    if (!timelinePoints.length) return 0;
    return Math.round(timelinePoints.reduce((sum, point) => sum + point.count, 0) / timelinePoints.length);
  }, [timelinePoints]);

  const formatRelative = (dateRaw: string) => {
    const date = new Date(dateRaw);
    if (Number.isNaN(date.getTime())) return 'unknown';
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
      <div className="noise-layer" />
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--panel-solid)]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">AI Canada Pulse</p>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">National AI Intelligence Cockpit</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Executive-grade monitoring across policy, research, funding, open source, and media since 2022-11-30.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[var(--line)] bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
              Last scan: {stats?.lastScan && stats.lastScan !== 'Never' ? formatRelative(stats.lastScan) : 'never'}
            </span>
            <button
              onClick={runScan}
              disabled={scanning}
              className="rounded-xl border border-[var(--line)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-8 md:py-7">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <KpiCard label="Signals" value={stats?.totalItems || 0} detail="All tracked items" />
          <KpiCard label="Today" value={stats?.itemsToday || 0} detail="New in 24h" />
          <KpiCard label="Week" value={stats?.itemsThisWeek || 0} detail="Last 7 days" />
          <KpiCard label="Month" value={stats?.itemsThisMonth || 0} detail="Current month" />
          <KpiCard
            label="Rel. Score"
            value={stats?.quality.avgRelevance || 0}
            detail="Average relevance"
            precision={2}
          />
          <KpiCard
            label="Source Trust"
            value={stats?.quality.avgReliability || 0}
            detail={`${stats?.quality.sourceDiversity || 0} active sources`}
            precision={1}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="panel p-4 md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Signal Velocity</h2>
                <p className="text-sm text-[var(--muted)]">Volume over time, with dynamic window control.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['daily', 'weekly', 'monthly', 'yearly'] as TimelineMode[]).map((mode) => (
                  <Chip
                    key={mode}
                    active={timelineMode === mode}
                    onClick={() => setTimelineMode(mode)}
                    label={mode}
                  />
                ))}
              </div>
            </div>

            <LineChart points={timelinePoints} />

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MiniMetric label="Window Avg" value={avgTimeline} />
              <MiniMetric label="Peak" value={Math.max(...timelinePoints.map((p) => p.count), 0)} />
              <MiniMetric label="Signal Mix" value={`${stats?.signalMix.high || 0}/${stats?.signalMix.medium || 0}/${stats?.signalMix.low || 0}`} />
            </div>
          </div>

          <div className="panel p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">AI Briefing</h2>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as BriefMode[]).map((mode) => (
                  <Chip key={mode} active={briefMode === mode} onClick={() => setBriefMode(mode)} label={mode} />
                ))}
              </div>
            </div>

            {activeBrief ? <BriefCard brief={activeBrief} /> : <p className="text-sm text-[var(--muted)]">Loading...</p>}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
          <div className="panel p-4 md:p-5">
            <h3 className="text-base font-semibold">Event Radar</h3>
            <p className="mb-3 text-sm text-[var(--muted)]">Clustered multi-source narratives with highest strategic weight.</p>
            <div className="space-y-2">
              {(stats?.eventClusters || []).slice(0, 6).map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))}
              {!stats?.eventClusters?.length && <p className="text-sm text-[var(--muted)]">No event clusters yet.</p>}
            </div>
          </div>

          <div className="panel p-4 md:p-5">
            <h3 className="text-base font-semibold">Momentum Movers</h3>
            <p className="mb-3 text-sm text-[var(--muted)]">Entity mention change vs previous week.</p>
            <div className="space-y-1.5">
              {(stats?.momentum || []).slice(0, 10).map((item) => (
                <MomentumRow key={item.name} item={item} onClick={() => setQuery(item.name)} />
              ))}
              {!stats?.momentum?.length && <p className="text-sm text-[var(--muted)]">Momentum data unavailable.</p>}
            </div>
          </div>

          <div className="panel p-4 md:p-5">
            <h3 className="text-base font-semibold">Activity Heatmap</h3>
            <p className="mb-3 text-sm text-[var(--muted)]">84-day signal intensity matrix.</p>
            <Heatmap cells={stats?.heatmap || []} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="panel p-4 md:p-5">
            <h3 className="mb-3 text-base font-semibold">Source Quality Matrix</h3>
            <div className="space-y-2">
              {(stats?.sourceReliability || []).slice(0, 10).map((source) => (
                <button
                  key={source.name}
                  onClick={() => setQuery(source.name)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-left transition hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{source.name}</p>
                    <p className="text-xs text-[var(--muted)]">{source.count} items</p>
                  </div>
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200/70">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#3da8ff] to-[#2ce2b2]" style={{ width: `${source.score}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-[var(--muted)]">{source.score}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-4 md:p-5">
            <h3 className="mb-3 text-base font-semibold">Watchlists</h3>
            <div className="space-y-2">
              {(stats?.watchlists || []).map((watch) => (
                <button
                  key={watch.id}
                  onClick={() => setActiveWatchlist(watch.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    activeWatchlist === watch.id
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--line)] bg-[var(--surface-2)] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{watch.name}</p>
                    <DeltaTag direction={watch.direction} delta={watch.deltaPercent} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{watch.description}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{watch.count} items this week</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveWatchlist('all')}
              className="mt-3 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)] transition hover:bg-white"
            >
              Show all watchlists
            </button>
          </div>
        </section>

        <section className="panel p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              <Chip active={activeType === 'all'} onClick={() => setActiveType('all')} label="all types" />
              {(Object.keys(TYPE_META) as IntelType[]).map((type) => (
                <Chip key={type} active={activeType === type} onClick={() => setActiveType(type)} label={TYPE_META[type].label} />
              ))}
            </div>
            <div className="ml-auto flex w-full flex-wrap gap-2 md:w-auto">
              <select
                value={activeWatchlist}
                onChange={(event) => setActiveWatchlist(event.target.value)}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
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
                placeholder="Search entities, sources, or themes"
                className="min-w-[260px] flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none ring-[var(--accent)]/25 transition focus:ring"
              />
            </div>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-[var(--muted)]">Loading signal feed...</p>
          ) : filteredItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--muted)]">No signals match current filters.</p>
          ) : (
            <div className="space-y-2">
              {filteredItems.slice(0, 80).map((item) => (
                <article key={item.id} className="rounded-xl border border-[var(--line)] bg-white/70 p-3 transition hover:border-white/20">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span
                      className="rounded-full px-2 py-0.5 font-medium"
                      style={{ backgroundColor: TYPE_META[item.type].color, color: '#051018' }}
                    >
                      {TYPE_META[item.type].label}
                    </span>
                    <span>{item.source}</span>
                    <span>{formatRelative(item.publishedAt)}</span>
                    <span>relevance {item.relevanceScore.toFixed(1)}</span>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-base font-semibold leading-snug transition hover:text-[var(--accent)]"
                  >
                    {item.title}
                  </a>

                  <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
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

                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.entities.map((entity) => (
                      <button
                        key={`${item.id}-${entity}`}
                        onClick={() => setQuery(entity)}
                        className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)] transition hover:bg-white/5"
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

function KpiCard(props: { label: string; value: number; detail: string; precision?: number }) {
  const value = props.precision !== undefined ? props.value.toFixed(props.precision) : props.value.toLocaleString();

  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{props.detail}</p>
    </div>
  );
}

function MiniMetric(props: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{props.label}</p>
      <p className="mt-1 text-lg font-semibold">{props.value}</p>
    </div>
  );
}

function Chip(props: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition ${
        props.active
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:bg-white'
      }`}
    >
      {props.label}
    </button>
  );
}

function BriefCard(props: { brief: Briefing }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-gradient-to-br from-white/[0.08] to-transparent p-3">
      <p className="text-sm font-semibold">{props.brief.headline}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{props.brief.summary}</p>
      <ul className="mt-3 space-y-1">
        {props.brief.bullets.map((bullet) => (
          <li key={bullet} className="text-xs text-[var(--muted)]">
            - {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClusterCard(props: { cluster: EventCluster }) {
  return (
    <a
      href={props.cluster.topUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-left transition hover:bg-white"
    >
      <p className="line-clamp-2 text-sm font-semibold">{props.cluster.headline}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span>{props.cluster.itemCount} items</span>
        <span>{props.cluster.sources.length} sources</span>
        <span>score {props.cluster.score.toFixed(1)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {props.cluster.entities.slice(0, 3).map((entity) => (
          <span key={entity} className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
            {entity}
          </span>
        ))}
      </div>
      <span className="mt-2 inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        Open Source
      </span>
    </a>
  );
}

function MomentumRow(props: { item: MomentumItem; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className="flex w-full items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-left transition hover:bg-white"
    >
      <div>
        <p className="text-sm font-medium">{props.item.name}</p>
        <p className="text-xs text-[var(--muted)]">
          {props.item.current} now vs {props.item.previous} prior
        </p>
      </div>
      <DeltaTag direction={props.item.direction} delta={props.item.deltaPercent} />
    </button>
  );
}

function DeltaTag(props: { direction: TrendDirection; delta: number }) {
  const sign = props.direction === 'up' ? '+' : props.direction === 'down' ? '' : '~';
  const color = props.direction === 'up' ? 'text-emerald-700' : props.direction === 'down' ? 'text-rose-700' : 'text-slate-600';

  return <span className={`text-xs font-semibold ${color}`}>{`${sign}${props.delta}%`}</span>;
}

function LineChart(props: { points: TimelinePoint[] }) {
  const width = 940;
  const height = 260;
  const padding = 28;

  if (!props.points.length) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-[var(--muted)]">No timeline data.</div>;
  }

  const max = Math.max(...props.points.map((point) => point.count), 1);
  const min = Math.min(...props.points.map((point) => point.count), 0);
  const range = Math.max(max - min, 1);

  const coordinates = props.points.map((point, index) => {
    const x = padding + (index / Math.max(props.points.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (point.count - min) / range) * (height - padding * 2);
    return { x, y, label: point.label, count: point.count };
  });

  const path = coordinates.map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`).join(' ');
  const areaPath = `${path} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full min-w-[640px]">
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#3da8ff" />
            <stop offset="100%" stopColor="#2ce2b2" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(61,168,255,0.28)" />
            <stop offset="100%" stopColor="rgba(44,226,178,0.03)" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((step) => {
          const y = padding + (step / 4) * (height - padding * 2);
          return <line key={step} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(19,40,63,0.14)" />;
        })}

        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={path} fill="none" stroke="url(#lineGradient)" strokeWidth={3} />

        {coordinates.filter((_, index) => index % Math.ceil(coordinates.length / 8) === 0).map((coord) => (
          <g key={`${coord.label}-${coord.x}`}>
            <circle cx={coord.x} cy={coord.y} r={4} fill="#2ce2b2" />
            <text x={coord.x} y={height - 8} textAnchor="middle" fill="rgba(19,40,63,0.55)" fontSize="11">
              {coord.label.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Heatmap(props: { cells: { date: string; count: number }[] }) {
  if (!props.cells.length) return <p className="text-sm text-[var(--muted)]">No heatmap data.</p>;

  const max = Math.max(...props.cells.map((cell) => cell.count), 1);

  return (
    <div className="grid grid-cols-14 gap-1">
      {props.cells.map((cell) => {
        const intensity = cell.count / max;
        const alpha = intensity === 0 ? 0.12 : 0.2 + intensity * 0.8;

        return (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.count}`}
            className="h-3.5 rounded-[3px] border border-black/20"
            style={{ backgroundColor: `rgba(44, 226, 178, ${alpha})` }}
          />
        );
      })}
    </div>
  );
}




