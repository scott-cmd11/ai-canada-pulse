"use client"

import { pulseScore } from "@/lib/mock-data"

const moodConfig = {
  green: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    accent: "#16a34a",
    text: "#15803d",
    emoji: "🟢",
    headline: "Canada is doing well",
  },
  amber: {
    bg: "#fffbeb",
    border: "#fde68a",
    accent: "#d97706",
    text: "#b45309",
    emoji: "🟡",
    headline: "Canada is holding steady",
  },
  red: {
    bg: "#fef2f2",
    border: "#fecaca",
    accent: "#dc2626",
    text: "#b91c1c",
    emoji: "🔴",
    headline: "Canada is under pressure",
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
  const { mood, description, updatedAt } = pulseScore
  const config = moodConfig[mood]

  return (
    <div
      className="rounded-2xl border-2 p-5 sm:p-6 shadow-sm"
      style={{ background: config.bg, borderColor: config.border }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: config.accent }}
      >
        Today in Canada
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
  )
}
