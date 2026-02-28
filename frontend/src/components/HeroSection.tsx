"use client"

import { useState, useEffect } from "react"
import type { PulseData } from "@/lib/mock-data"

const moodConfig = {
  green: { accent: "#10b981", label: "Positive" },
  amber: { accent: "#f59e0b", label: "Cautious" },
  red: { accent: "#ef4444", label: "Negative" },
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "just now"
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
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
    <div className="relative overflow-hidden rounded-lg border border-slate-700/40" style={{ minHeight: 300 }}>

      {/* Canada map background image — place your image at /canada-map-hero.png */}
      {/* If the image is missing the gradient glow below stands alone */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/canada-map-hero.png')" }}
      />

      {/* Cyan / purple ambient glow (visible even without image) */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 90% 70% at 50% 35%, rgba(6,182,212,0.14) 0%, transparent 65%)",
            "radial-gradient(ellipse 55% 80% at 30% 50%, rgba(139,92,246,0.10) 0%, transparent 55%)",
            "radial-gradient(ellipse 45% 60% at 75% 45%, rgba(59,130,246,0.09) 0%, transparent 55%)",
            "#0f172a",
          ].join(", "),
        }}
      />

      {/* Gradient fade: ensure text is readable; bleed into page bg at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(15,23,42,0.50) 0%, rgba(15,23,42,0.35) 35%, rgba(15,23,42,0.80) 72%, #0f172a 100%)",
        }}
      />

      {/* Side vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(15,23,42,0.75) 0%, transparent 28%, transparent 72%, rgba(15,23,42,0.75) 100%)",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 sm:py-24 sm:px-10">

        {/* Eyebrow */}
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-slate-500 mb-4">
          Real-time intelligence
        </p>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 tracking-tight leading-tight mb-4">
          AI Canada Pulse
        </h1>

        {/* Tagline */}
        <p className="text-sm sm:text-[15px] text-slate-400 max-w-lg mx-auto leading-relaxed mb-8">
          Tracking artificial intelligence across Canada — policy, research,
          talent&nbsp;&amp; market signals, updated live.
        </p>

        {/* Status badges */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live Data
          </span>

          {config && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm"
              style={{
                color: config.accent,
                background: `${config.accent}18`,
                borderColor: `${config.accent}50`,
              }}
            >
              Sector Mood: {config.label}
            </span>
          )}
        </div>

        {/* Pulse description */}
        {pulse && (
          <p className="text-xs text-slate-500 mt-5 max-w-2xl mx-auto leading-relaxed">
            {pulse.description}
          </p>
        )}

        {/* Updated at */}
        {pulse && (
          <p className="text-[10px] text-slate-600 mt-2">
            Updated {relativeTime(pulse.updatedAt)}
          </p>
        )}
      </div>

    </div>
  )
}
