"use client"

import Link from "next/link"

export default function Header() {
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-700 rounded text-white flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              Canada Pulse
            </span>
          </div>
          <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
          <p className="text-sm hidden sm:block font-medium text-slate-500">
            Tracking AI in Canada
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/methodology" className="text-slate-500 hover:text-indigo-700 hidden sm:block">
            Sources
          </Link>
          <span className="text-slate-500">{today}</span>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide">Live</span>
          </div>
        </div>
      </div>
    </header>
  )
}
