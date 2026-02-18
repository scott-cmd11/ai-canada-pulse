'use client';

import { TimelinePoint } from '@/lib/types';

export function MiniBars(props: { points: TimelinePoint[] }) {
  const max = Math.max(...props.points.map((entry) => entry.count), 1);
  return (
    <div className="mt-3 grid grid-cols-10 gap-1">
      {props.points.slice(-30).map((entry) => {
        const height = Math.max(6, Math.round((entry.count / max) * 40));
        return (
          <div key={entry.label} className="rounded-[3px] bg-[var(--surface-2)] p-[1px]" title={`${entry.label}: ${entry.count}`}>
            <div className="w-full rounded-[2px] bg-[#ff9d6a]" style={{ height }} />
          </div>
        );
      })}
    </div>
  );
}
