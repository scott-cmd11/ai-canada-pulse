import {
  ActivityHeatmapCell,
  Briefing,
  CHATGPT_MOMENT_ISO,
  DashboardStats,
  EventCluster,
  IntelItem,
  IntelType,
  MomentumItem,
  SourceReliability,
  TimelinePoint,
  TrendDirection,
  WATCHLISTS,
  WatchlistDefinition,
  WatchlistSnapshot,
} from './types';
import { Redis } from '@upstash/redis';

const INTEL_KEY = 'canada_ai_intel_items';
const LAST_SCAN_KEY = 'canada_ai_intel_last_scan';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    redis = new Redis({ url, token });
    return redis;
  }

  return null;
}

const memoryStore: { items: IntelItem[]; lastScan: string } = {
  items: [],
  lastScan: 'Never',
};

const SOURCE_SCORE_HINTS: { term: string; score: number }[] = [
  { term: 'canada.ca', score: 92 },
  { term: 'statcan', score: 90 },
  { term: 'cbc', score: 84 },
  { term: 'the globe and mail', score: 82 },
  { term: 'national post', score: 78 },
  { term: 'betakit', score: 76 },
  { term: 'thelogic', score: 76 },
  { term: 'vector institute', score: 89 },
  { term: 'mila', score: 90 },
  { term: 'amii', score: 89 },
  { term: 'cifar', score: 88 },
  { term: 'arxiv', score: 81 },
  { term: 'github', score: 70 },
  { term: 'google news', score: 66 },
];

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'of',
  'for',
  'in',
  'on',
  'to',
  'at',
  'from',
  'with',
  'canada',
  'canadian',
  'ai',
]);

function getItemDate(item: IntelItem): Date {
  const parsed = new Date(item.publishedAt);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(item.discoveredAt);
}

function createDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function matchesWatchTerms(item: IntelItem, watchlist: WatchlistDefinition): boolean {
  const text = `${item.title} ${item.description} ${item.category} ${item.entities.join(' ')}`.toLowerCase();
  return watchlist.terms.some((term) => text.includes(term.toLowerCase()));
}

function getSourceScore(source: string): number {
  const lower = source.toLowerCase();
  for (const hint of SOURCE_SCORE_HINTS) {
    if (lower.includes(hint.term)) return hint.score;
  }
  return 65;
}

function getReliabilityTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

function trendDirection(current: number, previous: number): TrendDirection {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function buildDailyTimeline(items: IntelItem[], days = 30): TimelinePoint[] {
  const counts: Record<string, number> = {};
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    counts[createDateKey(day)] = 0;
  }

  items.forEach((item) => {
    const key = createDateKey(getItemDate(item));
    if (counts[key] !== undefined) counts[key] += 1;
  });

  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

function buildWeeklyTimeline(items: IntelItem[], weeks = 16): TimelinePoint[] {
  const now = new Date();
  const buckets: { start: Date; end: Date; label: string; count: number }[] = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7, 23, 59, 59);
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6, 0, 0, 0);
    buckets.push({
      start,
      end,
      label: `${createDateKey(start)} to ${createDateKey(end)}`,
      count: 0,
    });
  }

  items.forEach((item) => {
    const date = getItemDate(item);
    for (const bucket of buckets) {
      if (date >= bucket.start && date <= bucket.end) {
        bucket.count += 1;
        break;
      }
    }
  });

  return buckets.map((bucket) => ({ label: bucket.label, count: bucket.count }));
}

function buildMonthlyTimeline(items: IntelItem[], months = 24): TimelinePoint[] {
  const now = new Date();
  const keys: string[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`);
  }

  const counts = keys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  items.forEach((item) => {
    const date = getItemDate(item);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (counts[key] !== undefined) counts[key] += 1;
  });

  return keys.map((label) => ({ label, count: counts[label] || 0 }));
}

function buildYearlyTimeline(items: IntelItem[]): TimelinePoint[] {
  const startYear = new Date(CHATGPT_MOMENT_ISO).getFullYear();
  const currentYear = new Date().getFullYear();
  const counts: Record<string, number> = {};

  for (let year = startYear; year <= currentYear; year += 1) {
    counts[String(year)] = 0;
  }

  items.forEach((item) => {
    const year = String(getItemDate(item).getFullYear());
    if (counts[year] !== undefined) counts[year] += 1;
  });

  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

function buildHeatmap(items: IntelItem[], days = 84): ActivityHeatmapCell[] {
  const counts: Record<string, number> = {};
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    counts[createDateKey(date)] = 0;
  }

  items.forEach((item) => {
    const key = createDateKey(getItemDate(item));
    if (counts[key] !== undefined) counts[key] += 1;
  });

  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

function buildSourceReliability(items: IntelItem[]): SourceReliability[] {
  const grouped: Record<string, { count: number; score: number }> = {};

  items.forEach((item) => {
    if (!grouped[item.source]) grouped[item.source] = { count: 0, score: getSourceScore(item.source) };
    grouped[item.source].count += 1;
  });

  return Object.entries(grouped)
    .map(([name, data]) => ({
      name,
      score: data.score,
      tier: getReliabilityTier(data.score),
      count: data.count,
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 20);
}

function buildSignalMix(sourceReliability: SourceReliability[]): { high: number; medium: number; low: number } {
  return sourceReliability.reduce(
    (acc, source) => {
      if (source.tier === 'high') acc.high += source.count;
      if (source.tier === 'medium') acc.medium += source.count;
      if (source.tier === 'low') acc.low += source.count;
      return acc;
    },
    { high: 0, medium: 0, low: 0 },
  );
}

function clusterKey(item: IntelItem): string {
  const tokens = `${item.title} ${item.entities.join(' ')}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  const unique = Array.from(new Set(tokens)).slice(0, 6);
  return unique.join(' ');
}

function buildEventClusters(items: IntelItem[]): EventCluster[] {
  const now = Date.now();
  const recent = items.filter((item) => now - getItemDate(item).getTime() <= 30 * 24 * 60 * 60 * 1000);
  const groups: Record<string, IntelItem[]> = {};

  recent.forEach((item) => {
    const key = clusterKey(item);
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return Object.entries(groups)
    .filter(([, group]) => group.length >= 2)
    .map(([key, group]) => {
      const sources = Array.from(new Set(group.map((item) => item.source))).slice(0, 6);
      const entities = Array.from(new Set(group.flatMap((item) => item.entities))).slice(0, 8);
      const types = Array.from(new Set(group.map((item) => item.type)));
      const topItem = [...group].sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
      const avgRel = group.reduce((sum, item) => sum + item.relevanceScore, 0) / group.length;
      const score = Number((group.length * 0.65 + sources.length * 0.8 + avgRel).toFixed(1));

      return {
        id: key,
        headline: topItem.title,
        itemCount: group.length,
        sources,
        entities,
        types,
        latestAt: group
          .map((item) => getItemDate(item).toISOString())
          .sort((a, b) => (a > b ? -1 : 1))[0],
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function buildMomentum(items: IntelItem[]): MomentumItem[] {
  const now = Date.now();
  const currentWindowStart = now - 7 * 24 * 60 * 60 * 1000;
  const previousWindowStart = now - 14 * 24 * 60 * 60 * 1000;

  const current: Record<string, number> = {};
  const previous: Record<string, number> = {};

  items.forEach((item) => {
    const ts = getItemDate(item).getTime();
    item.entities.forEach((entity) => {
      if (ts >= currentWindowStart) {
        current[entity] = (current[entity] || 0) + 1;
      } else if (ts >= previousWindowStart && ts < currentWindowStart) {
        previous[entity] = (previous[entity] || 0) + 1;
      }
    });
  });

  const names = Array.from(new Set([...Object.keys(current), ...Object.keys(previous)]));

  return names
    .map((name) => {
      const curr = current[name] || 0;
      const prev = previous[name] || 0;
      return {
        name,
        current: curr,
        previous: prev,
        deltaPercent: pctDelta(curr, prev),
        direction: trendDirection(curr, prev),
      };
    })
    .sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent))
    .slice(0, 12);
}

function buildBriefing(items: IntelItem[], eventClusters: EventCluster[], window: 'daily' | 'weekly' | 'monthly'): Briefing {
  const days = window === 'daily' ? 1 : window === 'weekly' ? 7 : 30;
  const now = Date.now();
  const start = now - days * 24 * 60 * 60 * 1000;

  const windowItems = items.filter((item) => getItemDate(item).getTime() >= start);
  const topCluster = eventClusters.find((cluster) => new Date(cluster.latestAt).getTime() >= start);

  const entityCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};

  windowItems.forEach((item) => {
    item.entities.forEach((entity) => {
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    });
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
  });

  const topEntity = Object.entries(entityCounts).sort((a, b) => b[1] - a[1])[0];
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];

  const windowLabel = window === 'daily' ? 'Daily' : window === 'weekly' ? 'Weekly' : 'Monthly';

  if (windowItems.length === 0) {
    return {
      window,
      headline: `${windowLabel} Brief: no new tracked signals`,
      summary: 'No new Canada AI items were captured in this window.',
      bullets: [
        'Use Scan Now to force a fresh ingestion cycle.',
        'Check that Redis and feed source endpoints are reachable.',
        'Monitor source health in the Source Reliability panel.',
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    window,
    headline: `${windowLabel} Brief: ${windowItems.length} tracked signals`,
    summary: topCluster
      ? `Top storyline: ${topCluster.headline}`
      : `Coverage remains diversified across ${new Set(windowItems.map((item) => item.source)).size} sources.`,
    bullets: [
      topEntity
        ? `${topEntity[0]} was the top-moving entity with ${topEntity[1]} mentions.`
        : 'No dominant entity emerged in this window.',
      topSource
        ? `${topSource[0]} contributed the most volume with ${topSource[1]} items.`
        : 'No dominant source appeared.',
      `Average relevance score for the window: ${(
        windowItems.reduce((sum, item) => sum + item.relevanceScore, 0) / windowItems.length
      ).toFixed(2)}.`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

function buildWatchlists(items: IntelItem[]): WatchlistSnapshot[] {
  const now = Date.now();
  const currentStart = now - 7 * 24 * 60 * 60 * 1000;
  const previousStart = now - 14 * 24 * 60 * 60 * 1000;

  return WATCHLISTS.map((watchlist) => {
    const currentItems = items.filter(
      (item) => getItemDate(item).getTime() >= currentStart && matchesWatchTerms(item, watchlist),
    );

    const previousItems = items.filter((item) => {
      const ts = getItemDate(item).getTime();
      return ts >= previousStart && ts < currentStart && matchesWatchTerms(item, watchlist);
    });

    return {
      id: watchlist.id,
      name: watchlist.name,
      description: watchlist.description,
      count: currentItems.length,
      deltaPercent: pctDelta(currentItems.length, previousItems.length),
      direction: trendDirection(currentItems.length, previousItems.length),
      topItems: [...currentItems]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3),
    };
  });
}

export async function getIntelItems(): Promise<IntelItem[]> {
  const client = getRedis();

  if (client) {
    try {
      const items = await client.get<IntelItem[]>(INTEL_KEY);
      return items || [];
    } catch (error) {
      console.error('Redis error, using memory fallback:', error);
    }
  }

  return memoryStore.items;
}

export async function addIntelItems(newItems: IntelItem[]): Promise<number> {
  const existing = await getIntelItems();
  const existingUrls = new Set(existing.map((item) => item.url));

  const uniqueNewItems = newItems.filter((item) => !existingUrls.has(item.url));

  if (uniqueNewItems.length > 0) {
    const combined = [...uniqueNewItems, ...existing]
      .sort((a, b) => getItemDate(b).getTime() - getItemDate(a).getTime())
      .slice(0, 5000);

    const client = getRedis();
    if (client) {
      try {
        await client.set(INTEL_KEY, combined);
      } catch (error) {
        console.error('Redis write error:', error);
        memoryStore.items = combined;
      }
    } else {
      memoryStore.items = combined;
    }
  }

  return uniqueNewItems.length;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const items = await getIntelItems();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const byType: Record<IntelType, number> = {
    news: 0,
    research: 0,
    policy: 0,
    github: 0,
    funding: 0,
  };

  const sourceCounts: Record<string, number> = {};
  const entityCounts: Record<string, number> = {};

  let itemsToday = 0;
  let itemsThisWeek = 0;
  let itemsThisMonth = 0;
  let itemsThisYear = 0;

  items.forEach((item) => {
    byType[item.type] = (byType[item.type] || 0) + 1;
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;

    item.entities.forEach((entity) => {
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    });

    const itemDate = getItemDate(item);
    if (itemDate >= todayStart) itemsToday += 1;
    if (itemDate >= weekStart) itemsThisWeek += 1;
    if (itemDate >= monthStart) itemsThisMonth += 1;
    if (itemDate >= yearStart) itemsThisYear += 1;
  });

  const bySource = Object.entries(sourceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const topEntities = Object.entries(entityCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const sourceReliability = buildSourceReliability(items);
  const signalMix = buildSignalMix(sourceReliability);
  const eventClusters = buildEventClusters(items);
  const momentum = buildMomentum(items);
  const watchlists = buildWatchlists(items);

  const totalRelevance = items.reduce((sum, item) => sum + item.relevanceScore, 0);
  const avgRelevance = items.length > 0 ? Number((totalRelevance / items.length).toFixed(2)) : 0;

  const weightedReliability = sourceReliability.reduce((sum, source) => sum + source.score * source.count, 0);
  const totalScoredItems = sourceReliability.reduce((sum, source) => sum + source.count, 0);
  const avgReliability = totalScoredItems > 0 ? Number((weightedReliability / totalScoredItems).toFixed(1)) : 0;

  let lastScan = 'Never';
  const client = getRedis();
  if (client) {
    try {
      lastScan = (await client.get<string>(LAST_SCAN_KEY)) || 'Never';
    } catch {
      lastScan = memoryStore.lastScan;
    }
  } else {
    lastScan = memoryStore.lastScan;
  }

  return {
    totalItems: items.length,
    itemsToday,
    itemsThisWeek,
    itemsThisMonth,
    itemsThisYear,
    byType,
    bySource,
    topEntities,
    timeline: {
      daily: buildDailyTimeline(items, 30),
      weekly: buildWeeklyTimeline(items, 16),
      monthly: buildMonthlyTimeline(items, 24),
      yearly: buildYearlyTimeline(items),
    },
    quality: {
      avgRelevance,
      avgReliability,
      sourceDiversity: bySource.length,
    },
    signalMix,
    sourceReliability,
    eventClusters,
    momentum,
    briefings: {
      daily: buildBriefing(items, eventClusters, 'daily'),
      weekly: buildBriefing(items, eventClusters, 'weekly'),
      monthly: buildBriefing(items, eventClusters, 'monthly'),
    },
    watchlists,
    heatmap: buildHeatmap(items, 84),
    lastScan,
  };
}

export async function updateLastScan(): Promise<void> {
  const timestamp = new Date().toISOString();
  const client = getRedis();

  if (client) {
    try {
      await client.set(LAST_SCAN_KEY, timestamp);
    } catch {
      memoryStore.lastScan = timestamp;
    }
  } else {
    memoryStore.lastScan = timestamp;
  }
}

export async function getItemsByType(type: IntelType, limit = 50): Promise<IntelItem[]> {
  const items = await getIntelItems();
  return items.filter((item) => item.type === type).slice(0, limit);
}

export async function getItemsByEntity(entity: string, limit = 50): Promise<IntelItem[]> {
  const items = await getIntelItems();
  return items
    .filter((item) => item.entities.some((entry) => entry.toLowerCase().includes(entity.toLowerCase())))
    .slice(0, limit);
}

export async function getItemsByWatchlist(watchlistId: string, limit = 50): Promise<IntelItem[]> {
  const items = await getIntelItems();
  const watchlist = WATCHLISTS.find((entry) => entry.id === watchlistId);
  if (!watchlist) return [];

  return items.filter((item) => matchesWatchTerms(item, watchlist)).slice(0, limit);
}

export async function searchItems(query: string, limit = 50): Promise<IntelItem[]> {
  const items = await getIntelItems();
  const lower = query.toLowerCase();

  return items
    .filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.source.toLowerCase().includes(lower) ||
        item.entities.some((entry) => entry.toLowerCase().includes(lower)),
    )
    .slice(0, limit);
}

export function isStorageConfigured(): boolean {
  return getRedis() !== null;
}

