'use client';

import { IntelType, WATCHLISTS } from '@/lib/types';
import { Chip } from './chip';

const TYPES: Array<IntelType | 'all'> = ['all', 'news', 'research', 'policy', 'funding', 'github'];

const TYPE_LABELS: Record<string, string> = {
  all: 'All',
  news: 'News',
  research: 'Research',
  policy: 'Policy',
  funding: 'Funding',
  github: 'GitHub',
};

interface FilterBarProps {
  activeType: IntelType | 'all';
  activeWatchlist: string;
  activeRegion: string;
  activeSource: string;
  query: string;
  regionOptions: string[];
  sourceOptions: string[];
  onTypeChange: (type: IntelType | 'all') => void;
  onWatchlistChange: (watchlist: string) => void;
  onRegionChange: (region: string) => void;
  onSourceChange: (source: string) => void;
  onQueryChange: (query: string) => void;
}

export function FilterBar({
  activeType,
  activeWatchlist,
  activeRegion,
  activeSource,
  query,
  regionOptions,
  sourceOptions,
  onTypeChange,
  onWatchlistChange,
  onRegionChange,
  onSourceChange,
  onQueryChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((type) => (
          <Chip key={type} active={activeType === type} onClick={() => onTypeChange(type)} label={TYPE_LABELS[type]} />
        ))}
      </div>

      <div className="ml-auto flex w-full flex-wrap gap-2 md:w-auto">
        <select
          aria-label="Watchlist filter"
          value={activeWatchlist}
          onChange={(e) => onWatchlistChange(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)]"
        >
          <option value="all">All Watchlists</option>
          {WATCHLISTS.map((watch) => (
            <option key={watch.id} value={watch.id}>{watch.name}</option>
          ))}
        </select>
        <select
          aria-label="Region filter"
          value={activeRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)]"
        >
          {regionOptions.map((option) => (
            <option key={option} value={option}>{option === 'all' ? 'All Regions' : option}</option>
          ))}
        </select>
        <select
          aria-label="Source filter"
          value={activeSource}
          onChange={(e) => onSourceChange(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)]"
        >
          {sourceOptions.map((option) => (
            <option key={option} value={option}>{option === 'all' ? 'All Sources' : option}</option>
          ))}
        </select>
        <input
          aria-label="Search signals"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search entities, sources, or themes"
          className="min-w-[180px] flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)]"
        />
      </div>
    </div>
  );
}
