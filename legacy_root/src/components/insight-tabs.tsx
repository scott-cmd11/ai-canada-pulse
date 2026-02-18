'use client';

export type InsightTab = 'briefings' | 'storylines' | 'trends' | 'sources' | 'watchlists';

const TABS: { id: InsightTab; label: string }[] = [
  { id: 'briefings', label: 'Briefings' },
  { id: 'storylines', label: 'Storylines' },
  { id: 'trends', label: 'Trends' },
  { id: 'sources', label: 'Sources' },
  { id: 'watchlists', label: 'Watchlists' },
];

interface InsightTabsProps {
  active: InsightTab;
  onChange: (tab: InsightTab) => void;
}

export function InsightTabs({ active, onChange }: InsightTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.14em] transition ${
            active === tab.id
              ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
              : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:bg-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
