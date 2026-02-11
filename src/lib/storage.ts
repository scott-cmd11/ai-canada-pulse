import {
  ActivityHeatmapCell,
  Briefing,
  CHATGPT_MOMENT_ISO,
  DashboardStats,
  EntitySummary,
  EventCluster,
  IntelItem,
  IntelType,
  MomentumItem,
  REGULATORY_TERMS,
  SOURCE_REGISTRY,
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
  { term: 'gc.ca', score: 92 },
  { term: 'statcan', score: 90 },
  { term: 'vector institute', score: 89 },
  { term: 'mila', score: 90 },
  { term: 'amii', score: 89 },
  { term: 'cifar', score: 88 },
  { term: 'cbc', score: 84 },
  { term: 'the globe and mail', score: 82 },
  { term: 'reuters', score: 83 },
  { term: 'bloomberg', score: 84 },
  { term: 'financial times', score: 84 },
  { term: 'national post', score: 78 },
  { term: 'betakit', score: 76 },
  { term: 'the logic', score: 77 },
  { term: 'policy options', score: 74 },
  { term: 'kpmg', score: 72 },
  { term: 'arxiv', score: 81 },
  { term: 'github', score: 70 },
  { term: 'newswire', score: 68 },
  { term: 'morningstar', score: 69 },
  { term: 'google news', score: 67 },
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
  'this',
  'that',
  'into',
  'over',
  'after',
  'before',
  'their',
  'there',
]);

function getItemDate(item: IntelItem): Date {
  const parsed = new Date(item.publishedAt);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(item.discoveredAt);
}

function createDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function buildTokenEmbedding(text: string): Record<string, number> {
  const counts: Record<string, number> = {};
  tokenize(text).forEach((token) => {
    counts[token] = (counts[token] || 0) + 1;
  });

  const norm = Math.sqrt(Object.values(counts).reduce((sum, value) => sum + value * value, 0)) || 1;
  Object.keys(counts).forEach((token) => {
    counts[token] = counts[token] / norm;
  });

  return counts;
}

function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  const smaller = Object.keys(a).length < Object.keys(b).length ? a : b;
  const larger = smaller === a ? b : a;

  let dot = 0;
  Object.entries(smaller).forEach(([token, weight]) => {
    dot += weight * (larger[token] || 0);
  });

  return dot;
}

function getWatchlistMatchScore(item: IntelItem, watchlist: WatchlistDefinition): number {
  const text = `${item.title} ${item.description} ${item.category} ${item.entities.join(' ')}`.toLowerCase();
  let score = 0;

  watchlist.terms.forEach((term) => {
    const normalized = term.toLowerCase();
    if (text.includes(normalized)) {
      score += normalized.includes(' ') ? 2 : 1;
    }
  });

  if (item.type === 'funding' && watchlist.id === 'startup-capital') score += 1;
  if (item.type === 'policy' && watchlist.id === 'public-policy') score += 1;
  if (item.type === 'research' && watchlist.id === 'foundation-models') score += 1;

  return score;
}

function matchesWatchTerms(item: IntelItem, watchlist: WatchlistDefinition): boolean {
  return getWatchlistMatchScore(item, watchlist) > 0;
}

function extractHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function getSourceScore(source: string, url?: string): number {
  const lower = source.toLowerCase();
  const host = extractHost(url || '');

  const merged = `${lower} ${host}`.trim();
  for (const hint of SOURCE_SCORE_HINTS) {
    if (merged.includes(hint.term)) return hint.score;
  }

  if (host.endsWith('.gc.ca') || host.endsWith('.gov')) return 90;
  if (host.includes('github.com')) return 70;
  if (host.includes('arxiv.org')) return 81;
  if (host.includes('wikipedia.org')) return 62;
  return 66;
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
  const grouped: Record<string, { count: number; weightedScore: number }> = {};

  items.forEach((item) => {
    if (!grouped[item.source]) grouped[item.source] = { count: 0, weightedScore: 0 };
    const itemScore = getSourceScore(item.source, item.url);
    grouped[item.source].count += 1;
    grouped[item.source].weightedScore += itemScore;
  });

  return Object.entries(grouped)
    .map(([name, data]) => ({
      name,
      score: Number((data.weightedScore / data.count).toFixed(1)),
      tier: getReliabilityTier(data.weightedScore / data.count),
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

function mergeEmbeddings(target: Record<string, number>, incoming: Record<string, number>): Record<string, number> {
  const merged: Record<string, number> = { ...target };
  Object.entries(incoming).forEach(([token, weight]) => {
    merged[token] = (merged[token] || 0) + weight;
  });

  const norm = Math.sqrt(Object.values(merged).reduce((sum, value) => sum + value * value, 0)) || 1;
  Object.keys(merged).forEach((token) => {
    merged[token] = merged[token] / norm;
  });

  return merged;
}

function buildEventClusters(items: IntelItem[]): EventCluster[] {
  const now = Date.now();
  const recent = items.filter((item) => now - getItemDate(item).getTime() <= 30 * 24 * 60 * 60 * 1000);

  type Bucket = {
    id: string;
    items: IntelItem[];
    embedding: Record<string, number>;
    tokenCounts: Record<string, number>;
  };

  const buckets: Bucket[] = [];

  recent.forEach((item) => {
    const text = `${item.title} ${item.description} ${item.entities.join(' ')}`;
    const embedding = buildTokenEmbedding(text);
    const tokenCounts: Record<string, number> = {};
    tokenize(text).forEach((token) => {
      tokenCounts[token] = (tokenCounts[token] || 0) + 1;
    });

    let matched: Bucket | null = null;
    let best = 0;

    for (const bucket of buckets) {
      const similarity = cosineSimilarity(embedding, bucket.embedding);
      if (similarity > best) {
        best = similarity;
        matched = bucket;
      }
    }

    if (matched && best >= 0.33) {
      matched.items.push(item);
      matched.embedding = mergeEmbeddings(matched.embedding, embedding);
      Object.entries(tokenCounts).forEach(([token, count]) => {
        matched!.tokenCounts[token] = (matched!.tokenCounts[token] || 0) + count;
      });
      return;
    }

    buckets.push({
      id: `${item.type}-${item.id}`,
      items: [item],
      embedding,
      tokenCounts,
    });
  });

  return buckets
    .filter((bucket) => bucket.items.length >= 2)
    .map((bucket) => {
      const group = bucket.items;
      const sources = Array.from(new Set(group.map((item) => item.source))).slice(0, 8);
      const entities = Array.from(new Set(group.flatMap((item) => item.entities))).slice(0, 10);
      const types = Array.from(new Set(group.map((item) => item.type)));
      const regionFocus = Array.from(new Set(group.map((item) => item.regionTag?.province || item.region || 'Canada'))).slice(0, 4);
      const topItem = [...group].sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
      const avgRel = group.reduce((sum, item) => sum + item.relevanceScore, 0) / group.length;
      const score = Number((group.length * 0.7 + sources.length * 0.9 + avgRel).toFixed(1));
      const keywordVector = Object.entries(bucket.tokenCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([token]) => token)
        .slice(0, 6);

      return {
        id: bucket.id,
        headline: topItem.title,
        topUrl: topItem.url,
        itemCount: group.length,
        sources,
        entities,
        types,
        latestAt: group
          .map((item) => getItemDate(item).toISOString())
          .sort((a, b) => (a > b ? -1 : 1))[0],
        score,
        keywordVector,
        regionFocus,
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
        .sort((a, b) => {
          const matchDelta = getWatchlistMatchScore(b, watchlist) - getWatchlistMatchScore(a, watchlist);
          if (matchDelta !== 0) return matchDelta;
          const relevanceDelta = b.relevanceScore - a.relevanceScore;
          if (relevanceDelta !== 0) return relevanceDelta;
          return getItemDate(b).getTime() - getItemDate(a).getTime();
        })
        .slice(0, 3),
    };
  });
}

function buildRegionalBreakdown(items: IntelItem[]): { region: string; count: number }[] {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const key = item.regionTag?.province || item.region || 'Canada';
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function buildRegulatorySnapshot(items: IntelItem[]) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const policyItems = items.filter((item) => item.type === 'policy');
  const weighted = policyItems.map((item) => {
    const text = `${item.title} ${item.description} ${item.category}`.toLowerCase();
    const termHits = REGULATORY_TERMS.reduce((sum, term) => (text.includes(term) ? sum + 1 : sum), 0);
    return { item, termHits };
  });

  const mentions24h = weighted.filter(({ item, termHits }) => now - getItemDate(item).getTime() <= oneDay && termHits > 0).length;
  const mentions7d = weighted.filter(({ item, termHits }) => now - getItemDate(item).getTime() <= sevenDays && termHits > 0).length;

  const avgHits = weighted.length ? weighted.reduce((sum, entry) => sum + entry.termHits, 0) / weighted.length : 0;
  const rawScore = Math.min(100, Math.round(mentions7d * 6 + mentions24h * 10 + avgHits * 18));
  const level: 'high' | 'medium' | 'low' = rawScore >= 70 ? 'high' : rawScore >= 35 ? 'medium' : 'low';

  return {
    score: rawScore,
    level,
    mentions24h,
    mentions7d,
    timeline: buildDailyTimeline(
      weighted.filter((entry) => entry.termHits > 0).map((entry) => entry.item),
      30,
    ),
  };
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
  const regionalBreakdown = buildRegionalBreakdown(items);
  const regulatory = buildRegulatorySnapshot(items);

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
    regionalBreakdown,
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
    sourceRegistry: SOURCE_REGISTRY,
    eventClusters,
    momentum,
    regulatory,
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

export async function getEntitySummary(entity: string): Promise<EntitySummary | null> {
  const matched = await getItemsByEntity(entity, 500);
  if (!matched.length) return null;

  const byType: Record<IntelType, number> = { news: 0, research: 0, policy: 0, github: 0, funding: 0 };
  const sourceCounts: Record<string, number> = {};
  const regionCounts: Record<string, number> = {};

  matched.forEach((item) => {
    byType[item.type] += 1;
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
    const region = item.regionTag?.province || item.region || 'Canada';
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  const topSources = Object.entries(sourceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const regions = Object.entries(regionCounts)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    name: entity,
    count: matched.length,
    avgRelevance: Number((matched.reduce((sum, item) => sum + item.relevanceScore, 0) / matched.length).toFixed(2)),
    topSources,
    recentItems: matched.slice(0, 25),
    latestAt: matched[0]?.publishedAt || null,
    byType,
    regions,
  };
}

export async function getItemsByRegion(region: string, limit = 50): Promise<IntelItem[]> {
  const lower = region.toLowerCase();
  const items = await getIntelItems();
  return items
    .filter((item) => {
      const province = item.regionTag?.province?.toLowerCase() || '';
      const city = item.regionTag?.city?.toLowerCase() || '';
      const direct = (item.region || '').toLowerCase();
      return province.includes(lower) || city.includes(lower) || direct.includes(lower);
    })
    .slice(0, limit);
}

export async function getItemsBySource(source: string, limit = 50): Promise<IntelItem[]> {
  const lower = source.toLowerCase();
  const items = await getIntelItems();
  return items.filter((item) => item.source.toLowerCase().includes(lower)).slice(0, limit);
}

export async function getItemsByWatchlist(watchlistId: string, limit = 50): Promise<IntelItem[]> {
  const items = await getIntelItems();
  const watchlist = WATCHLISTS.find((entry) => entry.id === watchlistId);
  if (!watchlist) return [];

  return items
    .filter((item) => matchesWatchTerms(item, watchlist))
    .sort((a, b) => {
      const matchDelta = getWatchlistMatchScore(b, watchlist) - getWatchlistMatchScore(a, watchlist);
      if (matchDelta !== 0) return matchDelta;
      return getItemDate(b).getTime() - getItemDate(a).getTime();
    })
    .slice(0, limit);
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
