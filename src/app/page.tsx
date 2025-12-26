'use client';

import { useState, useEffect, useCallback } from 'react';
import { IntelItem, IntelType, DashboardStats } from '@/lib/types';

const TYPE_LABELS: Record<IntelType, { label: string; icon: string; color: string }> = {
  news: { label: 'News', icon: '📰', color: 'bg-blue-500' },
  research: { label: 'Research', icon: '🔬', color: 'bg-purple-500' },
  github: { label: 'GitHub', icon: '💻', color: 'bg-gray-700' },
  patent: { label: 'Patents', icon: '📜', color: 'bg-amber-500' },
  funding: { label: 'Funding', icon: '💰', color: 'bg-green-500' },
};

export default function Dashboard() {
  const [items, setItems] = useState<IntelItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<IntelType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        fetch(`/api/intel?${activeFilter !== 'all' ? `type=${activeFilter}&` : ''}limit=100`),
        fetch('/api/stats')
      ]);

      const itemsData = await itemsRes.json();
      const statsData = await statsRes.json();

      if (itemsData.success) setItems(itemsData.items);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        alert(`Scan complete! Found ${data.itemsFound} items (${data.newItems} new)`);
      }
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Scan failed. Check console for details.');
    } finally {
      setScanning(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.entities.some(e => e.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-emerald-400">
                🌾 Grain Intelligence Monitor
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Automated monitoring of grain quality assessment ecosystem
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <div className="text-slate-400">Last scan</div>
                <div className="text-white">
                  {stats?.lastScan ? formatDate(stats.lastScan) : 'Never'}
                </div>
              </div>
              <button
                onClick={runScan}
                disabled={scanning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                {scanning ? '⏳ Scanning...' : '🔄 Scan Now'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-white">{stats?.totalItems || 0}</div>
            <div className="text-slate-400 text-sm">Total Items</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-emerald-400">{stats?.itemsToday || 0}</div>
            <div className="text-slate-400 text-sm">New Today</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-blue-400">{stats?.itemsThisWeek || 0}</div>
            <div className="text-slate-400 text-sm">This Week</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-purple-400">
              {stats?.topEntities?.[0]?.count || 0}
            </div>
            <div className="text-slate-400 text-sm truncate">
              {stats?.topEntities?.[0]?.name || 'Top Entity'}
            </div>
          </div>
        </div>

        {/* Type Stats */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {Object.entries(TYPE_LABELS).map(([type, { label, icon, color }]) => (
            <div
              key={type}
              className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center"
            >
              <div className="text-2xl">{icon}</div>
              <div className="text-lg font-bold">
                {stats?.byType?.[type as IntelType] || 0}
              </div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All
            </button>
            {Object.entries(TYPE_LABELS).map(([type, { label, icon }]) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type as IntelType)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeFilter === type
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search intelligence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Intel Feed */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-4">⏳</div>
            Loading intelligence data...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-4">📭</div>
            <p>No intelligence items found.</p>
            <p className="text-sm mt-2">Click "Scan Now" to fetch the latest data.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          TYPE_LABELS[item.type].color
                        }`}
                      >
                        {TYPE_LABELS[item.type].icon} {TYPE_LABELS[item.type].label}
                      </span>
                      <span className="text-slate-500 text-sm">{item.source}</span>
                      <span className="text-slate-600 text-sm">•</span>
                      <span className="text-slate-500 text-sm">
                        {formatDate(item.publishedAt)}
                      </span>
                      <span className="ml-auto text-amber-400 text-sm">
                        {'⭐'.repeat(Math.round(item.relevanceScore))}
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors line-clamp-2"
                    >
                      {item.title}
                    </a>
                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.entities.map((entity) => (
                        <span
                          key={entity}
                          className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300"
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Top Entities Sidebar */}
        {stats?.topEntities && stats.topEntities.length > 0 && (
          <div className="mt-8 bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4">🏢 Top Mentioned Entities</h3>
            <div className="flex flex-wrap gap-2">
              {stats.topEntities.map((entity) => (
                <button
                  key={entity.name}
                  onClick={() => setSearchQuery(entity.name)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-sm transition-colors"
                >
                  {entity.name} ({entity.count})
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-slate-400 text-sm">
          Grain Intelligence Monitor • Auto-scans every 6 hours • Monitoring 23 companies, 21 products, 6 datasets
        </div>
      </footer>
    </div>
  );
}
