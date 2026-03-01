"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { PulseData } from "@/lib/mock-data"

const moodConfig = {
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", label: "Positive Outlook" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Neutral/Cautious" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Negative Watch" },
}

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
      .then((j) => { if (j.pulse) setPulse(j.pulse) })
      .catch(() => { })
  }, [])

  const config = pulse ? moodConfig[pulse.mood] : null

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
            Tracking Canada&apos;s $2.4B AI Strategy
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm font-medium">
          <Link href="/methodology" className="text-slate-500 hover:text-indigo-700 hidden sm:block">
            Sources
          </Link>

          {pulse && (
            <span className="text-xs text-slate-400 hidden sm:block">
              {relativeTime(pulse.updatedAt)}
            </span>
          )}

          {config && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
              <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
              <span className="text-xs font-semibold">{config.label}</span>
            </div>
          )}

          {!config && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide">Live</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
