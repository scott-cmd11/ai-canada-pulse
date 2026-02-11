import { CHATGPT_MOMENT_ISO, DashboardStats, IntelItem, IntelType, TimelinePoint } from './types';
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

function getItemDate(item: IntelItem): Date {
  const parsed = new Date(item.publishedAt);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(item.discoveredAt);
}

function createDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function buildDailyTimeline(items: IntelItem[], days = 30): TimelinePoint[] {
  const counts: Record<string, number> = {};
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = createDateKey(day);
    counts[key] = 0;
  }

  items.forEach((item) => {
    const date = getItemDate(item);
    const key = createDateKey(date);
    if (counts[key] !== undefined) counts[key] += 1;
  });

  return Object.entries(counts).map(([key, count]) => ({ label: key, count }));
}

function buildWeeklyTimeline(items: IntelItem[], weeks = 16): TimelinePoint[] {
  const now = new Date();
  const counts: Record<string, number> = {};

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6);
    const label = `${createDateKey(start)} to ${createDateKey(end)}`;
    counts[label] = 0;
  }

  items.forEach((item) => {
    const date = getItemDate(item);
    Object.keys(counts).forEach((label) => {
      const [startRaw, endRaw] = label.split(' to ');
      const start = new Date(startRaw);
      const end = new Date(endRaw);
      if (date >= start && date <= new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)) {
        counts[label] += 1;
      }
    });
  });

  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

function buildMonthlyTimeline(items: IntelItem[], months = 24): TimelinePoint[] {
  const now = new Date();
  const keys: string[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    keys.push(key);
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

  const topEntities = Object.entries(entityCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const bySource = Object.entries(sourceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

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
