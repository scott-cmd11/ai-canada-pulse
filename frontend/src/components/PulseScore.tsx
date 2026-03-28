"use client"

import { useState, useEffect } from "react"
import type { PulseData } from "@/lib/mock-data"
import { relativeTime } from "@/lib/relative-time"

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

export default function PulseScore() {
  const [pulse, setPulse] = useState<PulseData | null>(null)

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((res) => res.json())
      .then((json) => {
        if (json.pulse) setPulse(json.pulse)
      })
      .catch((err) => console.warn("[PulseScore] fetch failed:", err))
  }, [])

  if (!pulse) {
    return (
      <div className="rounded border p-6" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading pulse data...</p>
      </div>
    )
  }

  const { mood, description, updatedAt } = pulse
  const config = moodConfig[mood]

  return (
    <div className={`rounded border border-l-2 ${config.borderClass} p-5 sm:p-6`} style={{ backgroundColor: 'var(--surface-secondary)', borderTopColor: 'var(--border-subtle)', borderRightColor: 'var(--border-subtle)', borderBottomColor: 'var(--border-subtle)' }}>
      <div className="flex items-center gap-3 mb-1">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Sector Pulse
        </p>
        <span
          className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
          style={{ color: config.accent, background: `${config.accent}15` }}
        >
          {config.label}
        </span>
      </div>

      <p className="text-sm sm:text-base leading-relaxed mt-2 max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>

      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        Updated {relativeTime(updatedAt)}
      </p>
    </div>
  )
}
