'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Overview' },
  { href: '/briefings', label: 'Briefings' },
  { href: '/signals', label: 'Signals' },
  { href: '/sources', label: 'Sources' },
  { href: '/watchlists', label: 'Watchlists' },
];

export function GlobalNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color:var(--panel-solid)]/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-[var(--text)]">
          AI CANADA PULSE
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                    : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:bg-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

