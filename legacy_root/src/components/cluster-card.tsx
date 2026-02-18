'use client';

import Link from 'next/link';
import { EventCluster } from '@/lib/types';

interface ClusterCardProps {
  cluster: EventCluster;
  onNote?: () => void;
  onCreateWatchlist?: () => void;
}

export function ClusterCard({ cluster, onNote, onCreateWatchlist }: ClusterCardProps) {
  return (
    <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
      <a href={cluster.topUrl} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-sm font-semibold hover:text-[var(--accent)]">
        {cluster.headline}
      </a>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span>{cluster.itemCount} items</span>
        <span>{cluster.sources.length} sources</span>
        <span>score {cluster.score.toFixed(1)}</span>
      </div>
      {cluster.entities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {cluster.entities.slice(0, 3).map((entity) => (
            <Link key={entity} href={`/entities/${encodeURIComponent(entity)}`} className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--muted)] transition hover:bg-white">
              {entity}
            </Link>
          ))}
        </div>
      )}
      {cluster.keywordVector.length > 0 && (
        <p className="mt-2 text-[11px] text-[var(--muted)]">Keywords: {cluster.keywordVector.join(', ')}</p>
      )}
      {(onCreateWatchlist || onNote) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {onCreateWatchlist && (
            <button onClick={onCreateWatchlist} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white">
              Draft Watchlist
            </button>
          )}
          {onNote && (
            <button onClick={onNote} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white">
              Annotate
            </button>
          )}
        </div>
      )}
    </article>
  );
}
