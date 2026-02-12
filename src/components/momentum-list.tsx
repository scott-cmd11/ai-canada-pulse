'use client';

import { MomentumItem } from '@/lib/types';

interface MomentumListProps {
  items: MomentumItem[];
  onSelect?: (name: string) => void;
  max?: number;
}

export function MomentumList({ items, onSelect, max = 10 }: MomentumListProps) {
  return (
    <div className="space-y-1.5">
      {items.slice(0, max).map((item) => (
        <MomentumRow key={item.name} item={item} onClick={() => onSelect?.(item.name)} />
      ))}
      {items.length === 0 && <p className="text-sm text-[var(--muted)]">No momentum data yet.</p>}
    </div>
  );
}

function MomentumRow(props: { item: MomentumItem; onClick: () => void }) {
  const sign = props.item.direction === 'up' ? '+' : props.item.direction === 'down' ? '' : '~';
  const color = props.item.direction === 'up' ? 'text-emerald-700' : props.item.direction === 'down' ? 'text-rose-700' : 'text-slate-600';

  return (
    <button onClick={props.onClick} className="flex w-full items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-left transition hover:bg-white">
      <div>
        <p className="text-sm font-medium">{props.item.name}</p>
        <p className="text-xs text-[var(--muted)]">{props.item.current} now vs {props.item.previous} prior</p>
      </div>
      <span className={`text-xs font-semibold ${color}`}>{`${sign}${props.item.deltaPercent}%`}</span>
    </button>
  );
}
