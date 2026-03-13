"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { PulseData } from "@/lib/mock-data"

const moodConfig = {
  green: { bg: "bg-emerald-400/20", border: "border-emerald-400/30", text: "text-emerald-100", label: "Positive Outlook", dot: "bg-emerald-400" },
  amber: { bg: "bg-amber-400/20", border: "border-amber-400/30", text: "text-amber-100", label: "Neutral / Cautious", dot: "bg-amber-400" },
  red: { bg: "bg-red-400/20", border: "border-red-400/30", text: "text-red-100", label: "Negative Watch", dot: "bg-red-400" },
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "Just now"
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 1200
    const step = Math.ceil(value / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(start)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  return <>{display.toLocaleString()}{suffix}</>
}

export default function HeroBanner({ embedded = false }: { embedded?: boolean }) {
  const [pulse, setPulse] = useState<PulseData | null>(null)

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((r) => r.json())
      .then((j) => {
        if (j.pulse) setPulse(j.pulse)
      })
      .catch(() => {})
  }, [])

  const config = pulse ? moodConfig[pulse.mood] : null

  return (
    <section className={embedded ? "" : "relative overflow-hidden rounded-2xl"}>
      {!embedded && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #312e81 50%, #1e1b4b 75%, #0f172a 100%)",
              backgroundSize: "400% 400%",
              animation: "gradientShift 12s ease infinite",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='0.5'%3E%3Cpath d='M0 30h60M30 0v60'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-500/25 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-[80px]" />
        </>
      )}

      <div className="absolute bottom-4 right-8 select-none text-[200px] leading-none opacity-[0.04] pointer-events-none">
        CA
      </div>

      <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white shadow-xl shadow-indigo-500/40 ring-2 ring-white/10">
                AI
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Canada Pulse
                </h1>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300 sm:text-sm">
                  Canada in the AI acceleration race
                </p>
              </div>
            </div>

            <p className="max-w-xl text-base leading-relaxed text-indigo-100/80 sm:text-lg">
              A Canada-first monitoring view of the global AI race. Track the frontier pace, the domestic signals that matter, and the evidence that capacity, markets, and institutions are moving faster.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/methodology"
                className="rounded-lg border border-indigo-400/30 bg-indigo-600/50 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-indigo-400 hover:bg-indigo-600"
              >
                View sources
              </Link>
              <Link
                href="/insights"
                className="text-sm font-semibold text-indigo-200 transition-colors hover:text-white hover:underline"
              >
                Open global context
              </Link>
              {pulse && <span className="text-xs text-indigo-300/70">Updated {relativeTime(pulse.updatedAt)}</span>}
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            {config && (
              <div className={`flex items-center gap-2.5 rounded-xl border px-5 py-2.5 backdrop-blur-sm ${config.bg} ${config.border}`}>
                <span className="relative flex h-3 w-3">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.dot} opacity-50`}></span>
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${config.dot}`}></span>
                </span>
                <span className={`text-sm font-bold ${config.text}`}>{config.label}</span>
              </div>
            )}

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-white">
                  <AnimatedNumber value={10} suffix="+" />
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/60">
                  Signals tracked
                </p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">
                  <AnimatedNumber value={3} />
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/60">
                  Decision bands
                </p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                  </span>
                  <p className="text-2xl font-black text-emerald-400">LIVE</p>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/60">
                  Monitoring
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}