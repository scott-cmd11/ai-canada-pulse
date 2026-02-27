"use client"

import { useState, useEffect } from "react"
import type { PulseData } from "@/lib/mock-data"

const moodConfig = {
  green: {
    accent: "#10b981",
    label: "Positive",
    borderClass: "border-l-emerald-500",
  },
  amber: {
    accent: "#f59e0b",
    label: "Neutral",
    borderClass: "border-l-amber-500",
  },
  red: {
    accent: "#ef4444",
    label: "Negative",
    borderClass: "border-l-red-500",
  },
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "just now"
  if (diff === 1) return "1 minute ago"
  if (diff < 60) return `${diff} minutes ago`
  return `${Math.floor(diff / 60)} hours ago`
}

export default function PulseScore() {
  const [pulse, setPulse] = useState<PulseData | null>(null)

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((res) => res.json())
      .then((json) => {
        if (json.pulse) setPulse(json.pulse)
      })
      .catch(() => {})
  }, [])

  if (!pulse) {
    return (
      <div className="bg-slate-800/50 rounded border border-slate-700/50 p-6">
        <p className="text-sm text-slate-500">Loading pulse data...</p>
      </div>
    )
  }

  const { mood, description, updatedAt } = pulse
  const config = moodConfig[mood]

  return (
    <div className={`bg-slate-800/60 rounded border border-slate-700/50 border-l-2 ${config.borderClass} p-5 sm:p-6`}>
      <div className="flex items-center gap-3 mb-1">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
          Sector Pulse
        </p>
        <span
          className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
          style={{ color: config.accent, background: `${config.accent}15` }}
        >
          {config.label}
        </span>
      </div>

      <p className="text-sm sm:text-base text-slate-300 leading-relaxed mt-2 max-w-3xl">
        {description}
      </p>

      <p className="text-xs text-slate-500 mt-3">
        Updated {relativeTime(updatedAt)}
      </p>
    </div>
  )
}
