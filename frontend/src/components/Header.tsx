"use client"

import Link from "next/link"
import LiveTicker from "./LiveTicker"
import ThemeToggle from "./ThemeToggle"
import { relativeTime } from "@/lib/relative-time"
import { useStories } from "@/hooks/useStories"

export default function Header() {
  const { pulse } = useStories()

  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <header className="sticky top-0 z-50 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl" style={{ borderBottom: "1px solid var(--header-border)", background: "var(--header-bg)" }}>
      <div className="border-b border-slate-200/70">
        <LiveTicker />
      </div>

      <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="group relative z-10 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-orange-700 to-amber-600 text-sm font-black text-white shadow-[0_8px_30px_rgba(194,65,12,0.3)]">
                AI
              </div>
              <div>
                <span className="block text-lg font-bold tracking-tight text-slate-950 group-hover:text-indigo-700">
                  Canada Pulse
                </span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Editorial intelligence monitor
                </span>
              </div>
            </Link>

            <div className="hidden h-8 w-px bg-slate-200 lg:block"></div>

            <div className="hidden lg:flex lg:flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Today</span>
              <span className="text-sm font-medium text-slate-600">{today}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/dashboard#provinces"
              className="rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm"
              style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)", background: "var(--surface-primary)" }}
            >
              Provinces
            </Link>
            <Link
              href="/methodology"
              className="rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm"
              style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)", background: "var(--surface-primary)" }}
            >
              Sources
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
