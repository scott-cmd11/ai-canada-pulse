'use client';

import { WatchlistDefinition, WatchlistSnapshot } from '@/lib/types';

interface WatchlistCardProps {
  definition: WatchlistDefinition;
  snapshot?: WatchlistSnapshot;
  onFilter?: () => void;
}

export function WatchlistCard({ definition, snapshot, onFilter }: WatchlistCardProps) {
  return (
    <article className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{definition.name}</h2>
        {onFilter && (
          <button
            onClick={onFilter}
            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white"
          >
            Filter Feed
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">{definition.description}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {snapshot?.count || 0} items this week - {snapshot?.deltaPercent || 0}% delta
      </p>
      {(snapshot?.topItems || []).length > 0 && (
        <div className="mt-3 space-y-2">
          {snapshot!.topItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 transition hover:bg-white"
            >
              <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{item.source}</p>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
