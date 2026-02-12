'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefing,
  CollaborationNote,
  DashboardStats,
  EventCluster,
  IntelItem,
  IntelType,
  MomentumItem,
  Nudge,
  TimelinePoint,
  WATCHLISTS,
} from '@/lib/types';

type TimelineMode = 'daily' | 'weekly' | 'monthly' | 'yearly';
type BriefMode = 'daily' | 'weekly' | 'monthly';
type DashboardMode = 'explorer' | 'briefing';
type ThemeMode = 'light' | 'dark';
type SectionId = 'agent' | 'nudges' | 'core' | 'radar' | 'feed';

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
  const [mode, setMode] = useState<DashboardMode>('briefing');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [notes, setNotes] = useState<CollaborationNote[]>([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [actionResult, setActionResult] = useState('');

  const [activeType, setActiveType] = useState<IntelType | 'all'>('all');
  const [activeWatchlist, setActiveWatchlist] = useState<string>('all');
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [activeSource, setActiveSource] = useState<string>('all');
  const [query, setQuery] = useState('');

  const [timelineMode, setTimelineMode] = useState<TimelineMode>('monthly');
  const [briefMode, setBriefMode] = useState<BriefMode>('weekly');
  const [hiddenSections, setHiddenSections] = useState<Record<SectionId, boolean>>({
    agent: false,
    nudges: false,
    core: false,
    radar: false,
    feed: false,
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '400');
      if (activeType !== 'all') params.set('type', activeType);
      if (activeWatchlist !== 'all') params.set('watchlist', activeWatchlist);
      if (activeRegion !== 'all') params.set('region', activeRegion);
      if (activeSource !== 'all') params.set('source', activeSource);

      const [intelRes, statsRes, notesRes] = await Promise.all([
        fetch(`/api/intel?${params.toString()}`),
        fetch('/api/stats'),
        fetch('/api/notes'),
      ]);

      const intelData = await intelRes.json();
      const statsData = await statsRes.json();
      const notesData = await notesRes.json();

      if (intelData.success) setItems(intelData.items);
      if (statsData.success) setStats(statsData.stats);
      if (notesData.success) setNotes(notesData.notes);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeType, activeWatchlist, activeRegion, activeSource]);

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
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('dashboard-theme') as ThemeMode | null;
    const savedSections = window.localStorage.getItem('dashboard-hidden-sections');
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections) as Record<SectionId, boolean>;
        setHiddenSections((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore malformed local storage
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem('dashboard-hidden-sections', JSON.stringify(hiddenSections));
  }, [hiddenSections]);

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

  const runAssistant = async () => {
    if (!assistantInput.trim()) return;
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: assistantInput }),
      });
      const data = await res.json();
      if (!data.success) {
        setAssistantReply(data.error || 'Assistant failed.');
        return;
      }
      const response = data.response;
      setAssistantReply(response.reply + (response.suggestion ? ` ${response.suggestion}` : ''));
      if (response.filters?.type) setActiveType(response.filters.type);
      if (response.filters?.watchlist) setActiveWatchlist(response.filters.watchlist);
      if (response.filters?.region) setActiveRegion(response.filters.region);
      if (response.filters?.source) setActiveSource(response.filters.source);
      if (response.filters?.query) setQuery(response.filters.query);
    } catch (error) {
      setAssistantReply(String(error));
    }
  };

  const postNote = async (targetType: 'entity' | 'cluster', targetId: string) => {
    const text = window.prompt('Add annotation');
    if (!text || !text.trim()) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, text }),
      });
      const data = await res.json();
      if (data.success) {
        setActionResult('Annotation saved.');
        await fetchData();
      }
    } catch (error) {
      setActionResult(String(error));
    }
  };

  const runAction = async (
    action: 'simulate-budget-shift' | 'create-watchlist-from-cluster' | 'subscribe-entity' | 'export-briefing',
    payload?: Record<string, string>,
  ) => {
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(payload || {}) }),
      });
      const data = await res.json();
      if (data.success) {
        const message = data.result?.message || 'Action complete.';
        const extra = data.result?.text ? `\n\n${data.result.text}` : '';
        setActionResult(`${message}${extra}`);
      } else {
        setActionResult(data.error || 'Action failed.');
      }
    } catch (error) {
      setActionResult(String(error));
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

  const timelinePoints: TimelinePoint[] = useMemo(() => (stats ? stats.timeline[timelineMode] : []), [stats, timelineMode]);
  const regulatoryTimeline: TimelinePoint[] = useMemo(() => stats?.regulatory.timeline || [], [stats]);
  const activeBrief: Briefing | null = useMemo(() => (stats ? stats.briefings[briefMode] : null), [stats, briefMode]);

  const avgTimeline = useMemo(() => {
    if (!timelinePoints.length) return 0;
    return Math.round(timelinePoints.reduce((sum, point) => sum + point.count, 0) / timelinePoints.length);
  }, [timelinePoints]);

  const weekVsToday = useMemo(() => {
    const week = stats?.itemsThisWeek || 0;
    const today = stats?.itemsToday || 0;
    return week === 0 ? 0 : Number(((today / week) * 100).toFixed(1));
  }, [stats]);

  const regionOptions = useMemo(() => ['all', ...(stats?.regionalBreakdown.map((entry) => entry.region) || [])], [stats]);
  const sourceOptions = useMemo(() => ['all', ...(stats?.bySource.map((entry) => entry.name) || [])], [stats]);

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
    <div className={`min-h-screen bg-[var(--bg)] text-[var(--text)] ${mode === 'explorer' ? 'theme-explorer' : 'theme-briefing'} ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <div className="noise-layer" />

      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--panel-solid)]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div>
            <p className="type-eyebrow text-[var(--muted)]">AI Canada Pulse</p>
            <h1 className="type-display">National AI Intelligence Cockpit</h1>
            <p className="type-body-sm mt-1 text-[var(--muted)]">
              Live Canada AI monitoring from the ChatGPT moment onward with entity, region, and policy tracking.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-2)] p-1" role="tablist" aria-label="Dashboard mode switch">
              <button
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] ${mode === 'briefing' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`}
                onClick={() => setMode('briefing')}
                role="tab"
                aria-selected={mode === 'briefing'}
              >
                Briefing
              </button>
              <button
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] ${mode === 'explorer' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`}
                onClick={() => setMode('explorer')}
                role="tab"
                aria-selected={mode === 'explorer'}
              >
                Explorer
              </button>
            </div>
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

      <main className="relative z-10 mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <article className="panel p-4 md:p-5">
            <p className="type-eyebrow text-[var(--muted)]">Executive Snapshot</p>
            <h2 className="type-title mt-1">Canada AI signal flow is {stats?.regulatory.level || 'low'} risk with {stats?.totalItems || 0} tracked items.</h2>
            <p className="type-body-sm mt-2 text-[var(--muted)]">
              Today contributes {weekVsToday}% of this week&apos;s volume. Top storyline:
              {' '}
              {stats?.eventClusters[0]?.headline || 'No dominant cluster yet.'}
            </p>
          </article>
          <article className="panel p-4 md:p-5">
            <div className="flex items-center justify-between">
              <h3 className="type-eyebrow text-[var(--muted)]">Display Settings</h3>
              <button
                onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]"
                title="Toggle light and dark dashboard theme"
              >
                Theme: {theme}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(['agent', 'nudges', 'core', 'radar', 'feed'] as SectionId[]).map((section) => (
                <button
                  key={section}
                  onClick={() =>
                    setHiddenSections((prev) => ({
                      ...prev,
                      [section]: !prev[section],
                    }))
                  }
                  className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white"
                  title="Show or hide section"
                >
                  {hiddenSections[section] ? `Show ${section}` : `Hide ${section}`}
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <KpiCard label="Signals" value={stats?.totalItems || 0} detail="All tracked items" onClick={() => setActiveType('all')} />
          <KpiCard label="Today" value={stats?.itemsToday || 0} detail="New in 24h" onClick={() => setQuery('today')} />
          <KpiCard label="Week" value={stats?.itemsThisWeek || 0} detail="Last 7 days" onClick={() => setTimelineMode('weekly')} />
          <KpiCard label="Month" value={stats?.itemsThisMonth || 0} detail="Current month" onClick={() => setTimelineMode('monthly')} />
          <KpiCard label="Rel. Score" value={stats?.quality.avgRelevance || 0} detail="Average relevance" precision={2} onClick={() => setMode('explorer')} />
          <KpiCard label="Source Trust" value={stats?.quality.avgReliability || 0} detail={`${stats?.quality.sourceDiversity || 0} active sources`} precision={1} onClick={() => setActiveSource('all')} />
          <KpiCard label="Policy Heat" value={stats?.regulatory.score || 0} detail={`Level: ${stats?.regulatory.level || 'low'}`} onClick={() => setActiveType('policy')} />
        </section>

        {!hiddenSections.agent || !hiddenSections.nudges ? (
        <section className="grid gap-4 xl:grid-cols-[1.8fr_1.2fr]">
          {!hiddenSections.agent ? <div className="panel p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="type-title">Agent Layer</h2>
              <button
                onClick={() => runAction('simulate-budget-shift')}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--muted)]"
              >
                Safe Simulation
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                aria-label="Ask assistant"
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') runAssistant();
                }}
                placeholder="Ask: show policy risk in Ontario"
                className="min-w-[260px] flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm"
              />
              <button onClick={runAssistant} className="rounded-lg border border-[var(--line)] bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white">
                Apply
              </button>
            </div>
            {assistantReply ? <p className="mt-2 text-sm text-[var(--muted)]">{assistantReply}</p> : null}
            {actionResult ? <pre className="mt-2 max-h-28 overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--muted)]">{actionResult}</pre> : null}
          </div> : <div className="panel p-4 md:p-5"><p className="text-sm text-[var(--muted)]">Agent panel is hidden in display settings.</p></div>}

          {!hiddenSections.nudges ? <div className="panel p-4 md:p-5">
            <h2 className="type-title">Proactive Nudges</h2>
            <div className="mt-3 space-y-2">
              {(stats?.nudges || []).map((nudge) => (
                <NudgeCard key={nudge.id} nudge={nudge} />
              ))}
              {!(stats?.nudges || []).length ? <p className="text-sm text-[var(--muted)]">No nudges yet.</p> : null}
            </div>
          </div> : <div className="panel p-4 md:p-5"><p className="text-sm text-[var(--muted)]">Nudges are hidden in display settings.</p></div>}
        </section>
        ) : null}

        {!hiddenSections.core ? (mode === 'briefing' ? (
          <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <div className="panel p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="type-title">Executive Briefing</h2>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as BriefMode[]).map((entry) => (
                    <Chip key={entry} active={briefMode === entry} onClick={() => setBriefMode(entry)} label={entry} />
                  ))}
                </div>
              </div>
              {activeBrief ? <BriefCard brief={activeBrief} /> : <p className="text-sm text-[var(--muted)]">Loading...</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => runAction('export-briefing')} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  Export Briefing
                </button>
                <Link href="/briefings" className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  Open Briefings
                </Link>
              </div>
            </div>

            <div className="panel p-4 md:p-5">
              <h3 className="type-title">Regulatory Thermometer</h3>
              <p className="type-body-sm mt-1 text-[var(--muted)]">
                Score {stats?.regulatory.score || 0} with threshold L/M/H at{' '}
                {stats?.regulatory.threshold.low || 0}/{stats?.regulatory.threshold.medium || 0}/{stats?.regulatory.threshold.high || 0}
              </p>
              <MiniBars points={regulatoryTimeline} />
            </div>
          </section>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <div className="panel p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="type-title">Signal Velocity</h2>
                  <p className="type-body-sm text-[var(--muted)]">Volume trend windows.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as TimelineMode[]).map((entry) => (
                    <Chip key={entry} active={timelineMode === entry} onClick={() => setTimelineMode(entry)} label={entry} />
                  ))}
                </div>
              </div>
              <LineChart points={timelinePoints} />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <MiniMetric label="Window Avg" value={avgTimeline} />
                <MiniMetric label="Peak" value={Math.max(...timelinePoints.map((p) => p.count), 0)} />
                <MiniMetric label="Policy 7d" value={stats?.regulatory.mentions7d || 0} />
              </div>
            </div>
            <div className="panel p-4 md:p-5">
              <h3 className="type-title">Entity Graph</h3>
              <p className="type-body-sm mb-3 text-[var(--muted)]">Relationship network across entities, sources, and regions.</p>
              <GraphPreview stats={stats} />
              <Link href="/graph" className="mt-3 inline-flex rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                Open Graph View
              </Link>
            </div>
          </section>
        )) : null}

        {!hiddenSections.radar ? (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
          <div className="panel p-4 md:p-5">
            <h3 className="type-title">Semantic Event Radar</h3>
            <p className="type-body-sm mb-3 text-[var(--muted)]">Embedding-based storyline clusters.</p>
            <div className="space-y-2">
              {(stats?.eventClusters || []).slice(0, 6).map((cluster) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  onNote={() => postNote('cluster', cluster.id)}
                  onCreateWatchlist={() => runAction('create-watchlist-from-cluster', { clusterId: cluster.id })}
                />
              ))}
              {!stats?.eventClusters?.length && <p className="text-sm text-[var(--muted)]">No event clusters yet.</p>}
            </div>
          </div>

          <div className="panel p-4 md:p-5">
            <h3 className="type-title">Momentum Movers</h3>
            <p className="type-body-sm mb-3 text-[var(--muted)]">Entity mention change vs previous week.</p>
            <div className="space-y-1.5">
              {(stats?.momentum || []).slice(0, 10).map((item) => (
                <MomentumRow key={item.name} item={item} onClick={() => setQuery(item.name)} />
              ))}
            </div>
          </div>

          <div className="panel p-4 md:p-5">
            <h3 className="type-title">Collaboration Notes</h3>
            <p className="type-body-sm mb-3 text-[var(--muted)]">Threaded annotations for entities and clusters.</p>
            <div className="space-y-2">
              {notes.slice(0, 8).map((note) => (
                <article key={note.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    {note.targetType} - {note.targetId}
                  </p>
                  <p className="mt-1 text-xs">{note.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {!hiddenSections.feed ? (
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
                aria-label="Watchlist filter"
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
              <select
                aria-label="Region filter"
                value={activeRegion}
                onChange={(event) => setActiveRegion(event.target.value)}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
              >
                {regionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Regions' : option}
                  </option>
                ))}
              </select>
              <select
                aria-label="Source filter"
                value={activeSource}
                onChange={(event) => setActiveSource(event.target.value)}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
              >
                {sourceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Sources' : option}
                  </option>
                ))}
              </select>
              <input
                aria-label="Search signals"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search entities, sources, or themes"
                className="min-w-[220px] flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
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
                    <span className="rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: TYPE_META[item.type].color, color: '#051018' }}>
                      {TYPE_META[item.type].label}
                    </span>
                    <span>{item.source}</span>
                    <span>{item.regionTag?.province || item.region || 'Canada'}</span>
                    <span>{formatRelative(item.publishedAt)}</span>
                    <span>
                      provenance {item.provenance?.sourceKind || 'unknown'} / {item.provenance?.sourceReliability || 0}
                    </span>
                  </div>

                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-base font-semibold leading-snug transition hover:text-[var(--accent)]">
                    {item.title}
                  </a>

                  <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.entities.map((entity) => (
                      <Link
                        key={`${item.id}-${entity}`}
                        href={`/entities/${encodeURIComponent(entity)}`}
                        className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)] transition hover:bg-white"
                      >
                        {entity}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => runAction('subscribe-entity', { entity: item.entities[0] || item.source })}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]"
                    >
                      Subscribe
                    </button>
                    <button
                      onClick={() => postNote('entity', item.entities[0] || item.source)}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]"
                    >
                      Annotate
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        ) : null}
      </main>
    </div>
  );
}

function KpiCard(props: { label: string; value: number; detail: string; precision?: number; onClick?: () => void }) {
  const value = props.precision !== undefined ? props.value.toFixed(props.precision) : props.value.toLocaleString();

  return (
    <button
      type="button"
      onClick={props.onClick}
      title="Click to drill down"
      className="panel p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <p className="type-eyebrow text-[var(--muted)]">{props.label}</p>
      <p className="type-metric mt-1">{value}</p>
      <p className="type-body-sm mt-1 text-[var(--muted)]">{props.detail}</p>
    </button>
  );
}

function MiniMetric(props: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
      <p className="type-eyebrow text-[var(--muted)]">{props.label}</p>
      <p className="type-title mt-1">{props.value}</p>
    </div>
  );
}

function Chip(props: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        props.active
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:bg-white'
      }`}
    >
      {props.label}
    </button>
  );
}

function NudgeCard(props: { nudge: Nudge }) {
  const icon = props.nudge.severity === 'critical' ? '!' : props.nudge.severity === 'warning' ? '^' : 'i';
  const tone = props.nudge.severity === 'critical' ? 'text-rose-700' : props.nudge.severity === 'warning' ? 'text-amber-700' : 'text-sky-700';

  return (
    <a href={props.nudge.actionTarget} className="block rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 transition hover:bg-white">
      <p className={`text-xs font-semibold ${tone}`}>
        {icon} {props.nudge.title}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{props.nudge.detail}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{props.nudge.actionLabel}</p>
    </a>
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

function ClusterCard(props: { cluster: EventCluster; onNote: () => void; onCreateWatchlist: () => void }) {
  return (
    <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
      <a href={props.cluster.topUrl} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-sm font-semibold hover:text-[var(--accent)]">
        {props.cluster.headline}
      </a>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span>{props.cluster.itemCount} items</span>
        <span>{props.cluster.sources.length} sources</span>
        <span>score {props.cluster.score.toFixed(1)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {props.cluster.entities.slice(0, 3).map((entity) => (
          <Link key={entity} href={`/entities/${encodeURIComponent(entity)}`} className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--muted)] transition hover:bg-white">
            {entity}
          </Link>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-[var(--muted)]">Keywords: {props.cluster.keywordVector.join(', ') || 'n/a'}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button onClick={props.onCreateWatchlist} className="rounded-lg border border-[var(--line)] bg-white/80 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Draft Watchlist
        </button>
        <button onClick={props.onNote} className="rounded-lg border border-[var(--line)] bg-white/80 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Annotate
        </button>
      </div>
    </article>
  );
}

function MiniBars(props: { points: TimelinePoint[] }) {
  const max = Math.max(...props.points.map((entry) => entry.count), 1);
  return (
    <div className="mt-3 grid grid-cols-10 gap-1">
      {props.points.slice(-30).map((entry) => {
        const height = Math.max(6, Math.round((entry.count / max) * 40));
        return (
          <div key={entry.label} className="rounded-[3px] bg-[var(--surface-2)] p-[1px]" title={`${entry.label}: ${entry.count}`}>
            <div className="w-full rounded-[2px] bg-[#ff9d6a]" style={{ height }} />
          </div>
        );
      })}
    </div>
  );
}

function GraphPreview(props: { stats: DashboardStats | null }) {
  if (!props.stats || !props.stats.relationshipGraph.nodes.length) {
    return <p className="text-sm text-[var(--muted)]">No graph data yet.</p>;
  }

  const nodes = props.stats.relationshipGraph.nodes.slice(0, 20);
  return (
    <div className="flex flex-wrap gap-1.5">
      {nodes.map((node) => (
        <span key={node.id} className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
          {node.label}
        </span>
      ))}
    </div>
  );
}

function MomentumRow(props: { item: MomentumItem; onClick: () => void }) {
  const sign = props.item.direction === 'up' ? '+' : props.item.direction === 'down' ? '' : '~';
  const color = props.item.direction === 'up' ? 'text-emerald-700' : props.item.direction === 'down' ? 'text-rose-700' : 'text-slate-600';

  return (
    <button onClick={props.onClick} className="flex w-full items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-left transition hover:bg-white">
      <div>
        <p className="text-sm font-medium">{props.item.name}</p>
        <p className="text-xs text-[var(--muted)]">{props.item.current} now vs {props.item.previous} prior</p>
      </div>
      <span className={`text-xs font-semibold ${color}`}>{`${sign}${props.item.deltaPercent}%`}</span>
    </button>
  );
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

        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={path} fill="none" stroke="url(#lineGradient)" strokeWidth={3} />
        {coordinates
          .map((coord, index) => ({ coord, index }))
          .filter((entry) => entry.index % Math.ceil(coordinates.length / 10) === 0)
          .map((entry) => (
          <g key={`${entry.coord.x}-${entry.coord.y}-${entry.index}`}>
            <circle cx={entry.coord.x} cy={entry.coord.y} r={3} fill="#2ce2b2" />
            <title>{`${props.points[entry.index]?.label || ''}: ${props.points[entry.index]?.count || 0}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
