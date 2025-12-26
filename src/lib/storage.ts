import { IntelItem, DashboardStats, IntelType } from './types';
import { Redis } from '@upstash/redis';

const INTEL_KEY = 'grain_intel_items';
const LAST_SCAN_KEY = 'grain_intel_last_scan';

// Initialize Redis client if credentials are available
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

// In-memory fallback for when Redis is not configured
let memoryStore: { items: IntelItem[]; lastScan: string } = {
  items: [],
  lastScan: 'Never'
};

// Get all intelligence items
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

// Add new intelligence items (deduplicates by URL)
export async function addIntelItems(newItems: IntelItem[]): Promise<number> {
  const existing = await getIntelItems();
  const existingUrls = new Set(existing.map(item => item.url));

  const uniqueNewItems = newItems.filter(item => !existingUrls.has(item.url));

  if (uniqueNewItems.length > 0) {
    const combined = [...uniqueNewItems, ...existing]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 1000); // Keep last 1000 items

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

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  const items = await getIntelItems();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const byType: Record<IntelType, number> = {
    news: 0, research: 0, patent: 0, github: 0, funding: 0
  };

  const entityCounts: Record<string, number> = {};
  let itemsToday = 0;
  let itemsThisWeek = 0;

  items.forEach(item => {
    byType[item.type] = (byType[item.type] || 0) + 1;

    const itemDate = new Date(item.discoveredAt);
    if (itemDate >= todayStart) itemsToday++;
    if (itemDate >= weekStart) itemsThisWeek++;

    item.entities.forEach(entity => {
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    });
  });

  const topEntities = Object.entries(entityCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  let lastScan = 'Never';
  const client = getRedis();
  if (client) {
    try {
      lastScan = await client.get<string>(LAST_SCAN_KEY) || 'Never';
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
    byType,
    topEntities,
    lastScan
  };
}

// Update last scan timestamp
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

// Get items by type
export async function getItemsByType(type: IntelType, limit = 50): Promise<IntelItem[]> {
  const items = await getIntelItems();
  return items.filter(item => item.type === type).slice(0, limit);
}

// Get items by entity
export async function getItemsByEntity(entity: string, limit = 50): Promise<IntelItem[]> {
  const items = await getIntelItems();
  return items
    .filter(item => item.entities.some(e => e.toLowerCase().includes(entity.toLowerCase())))
    .slice(0, limit);
}

// Search items
export async function searchItems(query: string, limit = 50): Promise<IntelItem[]> {
  const items = await getIntelItems();
  const lowerQuery = query.toLowerCase();
  return items
    .filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.entities.some(e => e.toLowerCase().includes(lowerQuery))
    )
    .slice(0, limit);
}

// Check if storage is configured
export function isStorageConfigured(): boolean {
  return getRedis() !== null;
}
