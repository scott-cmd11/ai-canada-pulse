'use client';

export function Chip(props: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        props.active
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:bg-white'
      }`}
    >
      {props.label}
    </button>
  );
}
