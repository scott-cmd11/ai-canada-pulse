import { IntelItem, DashboardStats, IntelType } from './types';
import { kv } from '@vercel/kv';

const INTEL_KEY = 'grain_intel_items';
const STATS_KEY = 'grain_intel_stats';
const LAST_SCAN_KEY = 'grain_intel_last_scan';

// Get all intelligence items
export async function getIntelItems(): Promise<IntelItem[]> {
  try {
    const items = await kv.get<IntelItem[]>(INTEL_KEY);
    return items || [];
  } catch (error) {
    console.error('Error fetching intel items:', error);
    return [];
  }
}

// Add new intelligence items (deduplicates by URL)
export async function addIntelItems(newItems: IntelItem[]): Promise<number> {
  try {
    const existing = await getIntelItems();
    const existingUrls = new Set(existing.map(item => item.url));

    const uniqueNewItems = newItems.filter(item => !existingUrls.has(item.url));

    if (uniqueNewItems.length > 0) {
      const combined = [...uniqueNewItems, ...existing]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 1000); // Keep last 1000 items

      await kv.set(INTEL_KEY, combined);
    }

    return uniqueNewItems.length;
  } catch (error) {
    console.error('Error adding intel items:', error);
    return 0;
  }
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
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

    const lastScan = await kv.get<string>(LAST_SCAN_KEY) || 'Never';

    return {
      totalItems: items.length,
      itemsToday,
      itemsThisWeek,
      byType,
      topEntities,
      lastScan
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      totalItems: 0,
      itemsToday: 0,
      itemsThisWeek: 0,
      byType: { news: 0, research: 0, patent: 0, github: 0, funding: 0 },
      topEntities: [],
      lastScan: 'Error'
    };
  }
}

// Update last scan timestamp
export async function updateLastScan(): Promise<void> {
  await kv.set(LAST_SCAN_KEY, new Date().toISOString());
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
