"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { PulseData } from "@/lib/mock-data"

const moodConfig = {
    green: { bg: "bg-emerald-400/20", border: "border-emerald-400/30", text: "text-emerald-100", label: "Positive Outlook" },
    amber: { bg: "bg-amber-400/20", border: "border-amber-400/30", text: "text-amber-100", label: "Neutral / Cautious" },
    red: { bg: "bg-red-400/20", border: "border-red-400/30", text: "text-red-100", label: "Negative Watch" },
}

function relativeTime(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (diff < 1) return "Just now"
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ago`
}

export default function HeroBanner() {
    const [pulse, setPulse] = useState<PulseData | null>(null)

    useEffect(() => {
        fetch("/api/v1/stories")
            .then((r) => r.json())
            .then((j) => { if (j.pulse) setPulse(j.pulse) })
            .catch(() => { })
    }, [])

    const config = pulse ? moodConfig[pulse.mood] : null

    return (
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 sm:px-10 py-10 sm:py-14">
            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.05]" style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 0h1v40H0zM39 0h1v40h-1zM0 0h40v1H0zM0 39h40v1H0z'/%3E%3C/g%3E%3C/svg%3E\")",
            }} />

            {/* Gradient glow accent */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                {/* Left: Title + description */}
                <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/30">
                            AI
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Canada Pulse
                            </h1>
                        </div>
                    </div>
                    <p className="text-base sm:text-lg text-indigo-200/80 leading-relaxed max-w-xl">
                        Real-time intelligence on Canada&apos;s AI ecosystem — tracking policy, economic indicators, market sentiment, and adoption trends across the country.
                    </p>
                    <div className="flex items-center gap-4 mt-5">
                        <Link
                            href="/methodology"
                            className="text-xs font-semibold text-indigo-300 hover:text-white border border-indigo-500/40 hover:border-indigo-400 px-4 py-2 rounded-lg transition-all"
                        >
                            View Sources →
                        </Link>
                        {pulse && (
                            <span className="text-xs text-indigo-400/70">
                                Updated {relativeTime(pulse.updatedAt)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Mood indicator + live stats */}
                <div className="flex flex-col items-start lg:items-end gap-3">
                    {config && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${config.bg} ${config.border}`}>
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-50"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-400"></span>
                            </span>
                            <span className={`text-sm font-bold ${config.text}`}>
                                {config.label}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                        <span className="text-xs font-medium text-emerald-300/80 uppercase tracking-wider">
                            10+ Live Data Sources
                        </span>
                    </div>
                </div>
            </div>
        </section>
    )
}
