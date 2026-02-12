'use client';

import { DashboardStats } from '@/lib/types';

interface SourceTableProps {
  stats: DashboardStats;
  onSourceSelect?: (name: string) => void;
}

export function SourceTable({ stats, onSourceSelect }: SourceTableProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Avg Reliability" value={stats.quality.avgReliability.toFixed(1)} />
        <Metric label="Source Diversity" value={String(stats.quality.sourceDiversity)} />
        <Metric label="Signal Mix H/M/L" value={`${stats.signalMix.high}/${stats.signalMix.medium}/${stats.signalMix.low}`} />
      </div>

      <div>
        <h3 className="type-title mb-3">Live Source Quality</h3>
        <div className="space-y-2">
          {stats.sourceReliability.map((source) => (
            <button
              key={source.name}
              onClick={() => onSourceSelect?.(source.name)}
              className="flex w-full items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-left transition hover:bg-white"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{source.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {source.count} items - {source.tier} tier
                </p>
              </div>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-black/20">
                <div className="h-2 rounded-full bg-gradient-to-r from-[#3da8ff] to-[#2ce2b2]" style={{ width: `${source.score}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-[var(--muted)]">{source.score}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="type-title mb-3">Source Registry</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Kind</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Cadence</th>
                <th className="px-2 py-2">Reliability</th>
              </tr>
            </thead>
            <tbody>
              {stats.sourceRegistry.map((source) => (
                <tr key={source.id} className="border-b border-[var(--line)]">
                  <td className="px-2 py-2">{source.name}</td>
                  <td className="px-2 py-2">{source.kind}</td>
                  <td className="px-2 py-2">{source.type}</td>
                  <td className="px-2 py-2">{source.cadenceMinutes}m</td>
                  <td className="px-2 py-2">{source.reliability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold">{props.value}</p>
    </div>
  );
}
