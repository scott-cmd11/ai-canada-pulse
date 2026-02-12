'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useSidebar } from './sidebar-context';

const NAV_ITEMS = [
  { href: '/', label: 'Feed' },
  { href: '/insights', label: 'Insights' },
  { href: '/graph', label: 'Graph' },
];

export function TopBarShell() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [scanning, setScanning] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      await res.json();
      window.location.reload();
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  }, []);

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      router.push(`/?q=${encodeURIComponent(searchValue.trim())}`);
    }
  }, [searchValue, router]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color:var(--panel-solid)]/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-2.5 md:px-8">
        <Link href="/" className="mr-2 text-sm font-semibold tracking-[0.18em] text-[var(--text)]">
          AI CANADA PULSE
        </Link>

        <nav className="flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.14em] transition ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:bg-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <input
            aria-label="Search signals"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search..."
            className="hidden w-48 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)] md:block lg:w-64"
          />
          <button
            onClick={runScan}
            disabled={scanning}
            className="rounded-lg border border-[var(--line)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {scanning ? 'Scanning...' : 'Scan'}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white"
            title="Open command panel"
            aria-label="Toggle command panel"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="3" r="1" />
              <circle cx="8" cy="8" r="1" />
              <circle cx="8" cy="13" r="1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
