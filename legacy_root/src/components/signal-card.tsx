'use client';

import Link from 'next/link';
import { IntelItem, IntelType } from '@/lib/types';

export const TYPE_META: Record<IntelType, { label: string; color: string }> = {
  news: { label: 'News', color: '#3da8ff' },
  research: { label: 'Research', color: '#35d6c9' },
  policy: { label: 'Policy', color: '#f4b645' },
  github: { label: 'GitHub', color: '#9aa4b8' },
  funding: { label: 'Funding', color: '#2ce2b2' },
};

function formatRelative(dateRaw: string) {
  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

interface SignalCardProps {
  item: IntelItem;
  onSubscribe?: (entity: string) => void;
  onAnnotate?: (entity: string) => void;
}

export function SignalCard({ item, onSubscribe, onAnnotate }: SignalCardProps) {
  const meta = TYPE_META[item.type];

  return (
    <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 transition hover:border-[var(--accent)]/30">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span className="rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: meta.color, color: '#051018' }}>
          {meta.label}
        </span>
        <span>{item.source}</span>
        <span>{item.regionTag?.province || item.region || 'Canada'}</span>
        <span>{formatRelative(item.publishedAt)}</span>
        {item.provenance && (
          <span className="hidden sm:inline">
            {item.provenance.sourceKind} / {item.provenance.sourceReliability}
          </span>
        )}
      </div>

      <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-base font-semibold leading-snug transition hover:text-[var(--accent)]">
        {item.title}
      </a>

      {item.description && <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{item.description}</p>}

      {item.entities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.entities.map((entity) => (
            <Link
              key={`${item.id}-${entity}`}
              href={`/entities/${encodeURIComponent(entity)}`}
              className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)] transition hover:bg-white hover:text-[var(--text)]"
            >
              {entity}
            </Link>
          ))}
        </div>
      )}

      {(onSubscribe || onAnnotate) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {onSubscribe && (
            <button
              onClick={() => onSubscribe(item.entities[0] || item.source)}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white"
            >
              Subscribe
            </button>
          )}
          {onAnnotate && (
            <button
              onClick={() => onAnnotate(item.entities[0] || item.source)}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white"
            >
              Annotate
            </button>
          )}
        </div>
      )}
    </article>
  );
}
