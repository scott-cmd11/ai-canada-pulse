'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardStats, IntelItem, IntelType } from '@/lib/types';

interface UseIntelDataOptions {
  limit?: number;
  defaultType?: IntelType | 'all';
  defaultWatchlist?: string;
}

export function useIntelData(options?: UseIntelDataOptions) {
  const limit = options?.limit || 300;

  const [items, setItems] = useState<IntelItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const [activeType, setActiveType] = useState<IntelType | 'all'>(options?.defaultType || 'all');
  const [activeWatchlist, setActiveWatchlist] = useState<string>(options?.defaultWatchlist || 'all');
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [activeSource, setActiveSource] = useState<string>('all');
  const [query, setQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (activeType !== 'all') params.set('type', activeType);
      if (activeWatchlist !== 'all') params.set('watchlist', activeWatchlist);
      if (activeRegion !== 'all') params.set('region', activeRegion);
      if (activeSource !== 'all') params.set('source', activeSource);

      const [intelRes, statsRes] = await Promise.all([fetch(`/api/intel?${params.toString()}`), fetch('/api/stats')]);

      const intelData = await intelRes.json();
      const statsData = await statsRes.json();

      if (intelData.success) setItems(intelData.items);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('Dashboard data fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, [activeType, activeWatchlist, activeRegion, activeSource, limit]);

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
      const text = `${item.title} ${item.description} ${item.source} ${item.entities.join(' ')}`.toLowerCase();
      return text.includes(lower);
    });
  }, [items, query]);

  return {
    items,
    filteredItems,
    stats,
    loading,
    scanning,
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
    fetchData,
    runScan,
  };
}
