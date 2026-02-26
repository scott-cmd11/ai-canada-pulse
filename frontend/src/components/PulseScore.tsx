"use client"

import { useState, useEffect } from "react"
import { pulseScore as fallbackPulse } from "@/lib/mock-data"
import type { PulseData } from "@/lib/mock-data"

const moodConfig = {
  green: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    accent: "#16a34a",
    text: "#15803d",
    emoji: "🟢",
    headline: "Canada's AI sector is thriving",
  },
  amber: {
    bg: "#fffbeb",
    border: "#fde68a",
    accent: "#d97706",
    text: "#b45309",
    emoji: "🟡",
    headline: "Canada's AI sector is holding steady",
  },
  red: {
    bg: "#fef2f2",
    border: "#fecaca",
    accent: "#dc2626",
    text: "#b91c1c",
    emoji: "🔴",
    headline: "Canada's AI sector is under pressure",
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
  const [pulse, setPulse] = useState<PulseData>(fallbackPulse)

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((res) => res.json())
      .then((json) => {
        if (json.pulse) {
          setPulse(json.pulse)
        }
      })
      .catch(() => {}) // keep fallback
  }, [])

  const { mood, description, updatedAt } = pulse
  const config = moodConfig[mood]

  return (
    <div
      className="rounded-2xl border-2 overflow-hidden shadow-sm"
      style={{ borderColor: config.border }}
    >
      {/* Animated gradient accent bar */}
      <div className="pulse-accent-bar" />

      <div className="p-5 sm:p-6" style={{ background: config.bg }}>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: config.accent }}
        >
          AI in Canada Today
        </p>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl" aria-hidden="true">{config.emoji}</span>
          <h2
            className="text-xl sm:text-2xl font-bold leading-tight"
            style={{ color: config.text }}
          >
            {config.headline}
          </h2>
        </div>

        <p
          className="text-sm sm:text-base leading-relaxed max-w-2xl"
          style={{ color: config.text }}
        >
          {description}
        </p>

        <p className="text-xs mt-3" style={{ color: config.accent }}>
          Updated {relativeTime(updatedAt)}
        </p>
      </div>
    </div>
  )
}
