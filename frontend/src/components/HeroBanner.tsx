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
            .then((j) => { if (j.pulse) setPulse(j.pulse) })
            .catch(() => { })
    }, [])

    const config = pulse ? moodConfig[pulse.mood] : null

    return (
        <section className={embedded ? "" : "relative overflow-hidden rounded-2xl"}>
            {/* Animated gradient background — only when standalone */}
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
                    <div className="absolute inset-0 opacity-[0.07]" style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='0.5'%3E%3Cpath d='M0 30h60M30 0v60'/%3E%3C/g%3E%3C/svg%3E\")",
                    }} />
                    <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-500/25 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]" />
                </>
            )}

            {/* Subtle maple leaf watermark */}
            <div className="absolute right-8 bottom-4 opacity-[0.04] text-[200px] leading-none pointer-events-none select-none">
                🍁
            </div>

            <div className="relative z-10 px-8 sm:px-12 py-10 sm:py-14">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    {/* Left: Title + description */}
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-500/40 ring-2 ring-white/10">
                                AI
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
                                    Canada Pulse
                                </h1>
                                <p className="text-xs sm:text-sm font-semibold text-indigo-300 uppercase tracking-[0.2em] mt-1">
                                    Real-Time AI Intelligence
                                </p>
                            </div>
                        </div>
                        <p className="text-base sm:text-lg text-indigo-200/70 leading-relaxed max-w-xl">
                            Tracking Canada&apos;s AI ecosystem. Market sentiment, research papers, economic indicators, compute infrastructure, and job market demand.
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                            <Link
                                href="/methodology"
                                className="text-sm font-semibold text-white bg-indigo-600/50 hover:bg-indigo-600 border border-indigo-400/30 hover:border-indigo-400 px-5 py-2.5 rounded-lg transition-all backdrop-blur-sm"
                            >
                                View Sources →
                            </Link>
                            {pulse && (
                                <span className="text-xs text-indigo-400/60">
                                    Updated {relativeTime(pulse.updatedAt)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Stats + Mood */}
                    <div className="flex flex-col items-start lg:items-end gap-4">
                        {/* Mood pill */}
                        {config && (
                            <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border backdrop-blur-sm ${config.bg} ${config.border}`}>
                                <span className="relative flex h-3 w-3">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-50`}></span>
                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${config.dot}`}></span>
                                </span>
                                <span className={`text-sm font-bold ${config.text}`}>
                                    {config.label}
                                </span>
                            </div>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">
                                    <AnimatedNumber value={10} suffix="+" />
                                </p>
                                <p className="text-[10px] font-semibold text-indigo-300/60 uppercase tracking-wider">
                                    Data Sources
                                </p>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">
                                    <AnimatedNumber value={4} />
                                </p>
                                <p className="text-[10px] font-semibold text-indigo-300/60 uppercase tracking-wider">
                                    Intelligence Groups
                                </p>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                    </span>
                                    <p className="text-2xl font-black text-emerald-400">LIVE</p>
                                </div>
                                <p className="text-[10px] font-semibold text-indigo-300/60 uppercase tracking-wider">
                                    Status
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    )
}
