'use client';

import { useState } from 'react';
import { Nudge } from '@/lib/types';

interface NudgeBannerProps {
  nudges: Nudge[];
}

export function NudgeBanner({ nudges }: NudgeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const important = nudges.filter((n) => n.severity === 'critical' || n.severity === 'warning');
  if (important.length === 0 || dismissed) return null;

  const top = important[0];
  const tone = top.severity === 'critical' ? 'border-rose-400/40 bg-rose-50/80' : 'border-amber-400/40 bg-amber-50/80';
  const textTone = top.severity === 'critical' ? 'text-rose-800' : 'text-amber-800';

  return (
    <div className={`rounded-xl border ${tone} px-4 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <a href={top.actionTarget} className={`text-sm font-semibold ${textTone}`}>
            {top.title}
          </a>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{top.detail}</p>
        </div>
        <div className="flex gap-2">
          {important.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg border border-[var(--line)] bg-white/60 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]"
            >
              {expanded ? 'Less' : `+${important.length - 1}`}
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-[var(--line)] bg-white/60 px-2 py-1 text-[11px] text-[var(--muted)]"
          >
            Dismiss
          </button>
        </div>
      </div>
      {expanded && important.length > 1 && (
        <div className="mt-2 space-y-1.5">
          {important.slice(1).map((nudge) => (
            <a
              key={nudge.id}
              href={nudge.actionTarget}
              className="block rounded-lg bg-white/40 px-3 py-2 text-xs"
            >
              <span className={nudge.severity === 'critical' ? 'font-semibold text-rose-700' : 'font-semibold text-amber-700'}>
                {nudge.title}
              </span>
              <span className="ml-2 text-[var(--muted)]">{nudge.detail}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
