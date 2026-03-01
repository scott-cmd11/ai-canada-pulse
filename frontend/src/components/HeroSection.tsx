"use client"

import { useState, useEffect } from "react"
import type { PulseData } from "@/lib/mock-data"

const moodConfig = {
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Positive Outlook" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Neutral/Cautious" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Negative Watch" },
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "Just updated"
  if (diff < 60) return `Updated ${diff}m ago`
  return `Updated ${Math.floor(diff / 60)}h ago`
}

export default function HeroSection() {
  const [pulse, setPulse] = useState<PulseData | null>(null)

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((r) => r.json())
      .then((j) => { if (j.pulse) setPulse(j.pulse) })
      .catch((err) => console.warn("[HeroSection] fetch failed:", err))
  }, [])

  const config = pulse ? moodConfig[pulse.mood] : null

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          National Impact Overview
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Tracking the impact of artificial intelligence across Canadian policy, markets, research, and labor.
        </p>
      </div>

      <div className="flex items-center gap-3 md:justify-end shrink-0">
        {pulse && (
          <span className="text-sm font-medium text-slate-500">
            {relativeTime(pulse.updatedAt)}
          </span>
        )}

        {config && (
          <div className={`px-3 py-1.5 rounded-md border ${config.bg} ${config.text} ${config.border} text-sm font-semibold flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${config.text.replace('text-', 'bg-')}`}></div>
            {config.label}
          </div>
        )}
      </div>
    </div>
  )
}
