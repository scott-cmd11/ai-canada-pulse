'use client';

import { useState } from 'react';
import { Briefing, DashboardStats } from '@/lib/types';
import { Chip } from './chip';

type BriefMode = 'daily' | 'weekly' | 'monthly';

interface BriefingPanelProps {
  stats: DashboardStats;
  onExport?: () => void;
}

export function BriefingPanel({ stats, onExport }: BriefingPanelProps) {
  const [mode, setMode] = useState<BriefMode>('weekly');
  const brief = stats.briefings[mode];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="type-title">Executive Briefing</h2>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as BriefMode[]).map((entry) => (
            <Chip key={entry} active={mode === entry} onClick={() => setMode(entry)} label={entry} />
          ))}
        </div>
      </div>

      <BriefCard brief={brief} />

      {onExport && (
        <div className="mt-3">
          <button onClick={onExport} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white">
            Export Briefing
          </button>
        </div>
      )}
    </div>
  );
}

function BriefCard(props: { brief: Briefing }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
      <p className="text-sm font-semibold">{props.brief.headline}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{props.brief.summary}</p>
      <ul className="mt-3 space-y-1">
        {props.brief.bullets.map((bullet) => (
          <li key={bullet} className="text-xs text-[var(--muted)]">
            - {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}
