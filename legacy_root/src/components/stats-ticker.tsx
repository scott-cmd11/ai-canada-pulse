'use client';

import Link from 'next/link';
import { DashboardStats } from '@/lib/types';

interface StatsTickerProps {
  stats: DashboardStats | null;
  lastScan?: string;
}

export function StatsTicker({ stats, lastScan }: StatsTickerProps) {
  if (!stats) return null;

  const items = [
    { label: 'Signals', value: stats.totalItems.toLocaleString(), href: '/insights?tab=trends' },
    { label: 'Today', value: `+${stats.itemsToday}`, href: undefined },
    { label: 'Week', value: String(stats.itemsThisWeek), href: '/insights?tab=trends' },
    { label: 'Policy', value: stats.regulatory.level, href: '/insights?tab=trends' },
    { label: 'Sources', value: String(stats.quality.sourceDiversity), href: '/insights?tab=sources' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2.5">
      {items.map((item) => {
        const inner = (
          <>
            <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</span>
            <span className="ml-1.5 text-sm font-semibold">{item.value}</span>
          </>
        );

        return item.href ? (
          <Link key={item.label} href={item.href} className="inline-flex items-center transition hover:text-[var(--accent)]">
            {inner}
          </Link>
        ) : (
          <span key={item.label} className="inline-flex items-center">
            {inner}
          </span>
        );
      })}
      {lastScan && lastScan !== 'Never' && (
        <span className="ml-auto text-[11px] text-[var(--muted)]">
          Last scan: {formatRelative(lastScan)}
        </span>
      )}
    </div>
  );
}

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
