'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CollaborationNote, DashboardStats, IntelItem, IntelType } from '@/lib/types';

interface UseIntelDataOptions {
  limit?: number;
  defaultType?: IntelType | 'all';
  defaultWatchlist?: string;
}

export function useIntelData(options?: UseIntelDataOptions) {
  const limit = options?.limit || 300;

  const [items, setItems] = useState<IntelItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notes, setNotes] = useState<CollaborationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const [activeType, setActiveType] = useState<IntelType | 'all'>(options?.defaultType || 'all');
  const [activeWatchlist, setActiveWatchlist] = useState<string>(options?.defaultWatchlist || 'all');
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [activeSource, setActiveSource] = useState<string>('all');
  const [query, setQuery] = useState('');

  const [assistantReply, setAssistantReply] = useState('');
  const [actionResult, setActionResult] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
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

  const runAssistant = async (input: string) => {
    if (!input.trim()) return;
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
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

  const postNote = async (targetType: 'entity' | 'cluster', targetId: string, text: string) => {
    if (!text.trim()) return;
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
      const text = `${item.title} ${item.description} ${item.source} ${item.entities.join(' ')}`.toLowerCase();
      return text.includes(lower);
    });
  }, [items, query]);

  return {
    items,
    filteredItems,
    stats,
    notes,
    loading,
    scanning,
    activeType,
    activeWatchlist,
    activeRegion,
    activeSource,
    query,
    assistantReply,
    actionResult,
    setActiveType,
    setActiveWatchlist,
    setActiveRegion,
    setActiveSource,
    setQuery,
    fetchData,
    runScan,
    runAssistant,
    postNote,
    runAction,
  };
}
