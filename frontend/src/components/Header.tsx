"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { PulseData } from "@/lib/mock-data"
import LiveTicker from "./LiveTicker"

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "Just updated"
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
}

export default function Header() {
  const [pulse, setPulse] = useState<PulseData | null>(null)

  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((r) => r.json())
      .then((j) => {
        if (j.pulse) setPulse(j.pulse)
      })
      .catch(() => {})
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="border-b border-slate-200/70">
        <LiveTicker />
      </div>

      <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="group relative z-10 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-[0_8px_30px_rgba(79,70,229,0.35)]">
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
            <Link
              href="/methodology"
              className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-indigo-200 hover:text-indigo-700"
            >
              Sources
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
