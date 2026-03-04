"use client"

import { useState, useEffect } from "react"

interface Props {
    brief: string[] | null
    sources?: { name: string; count: number }[]
}

export default function IntelligenceBrief({ brief, sources = [] }: Props) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (brief && brief.length > 0) {
            const t = setTimeout(() => setVisible(true), 200)
            return () => clearTimeout(t)
        }
    }, [brief])

    if (!brief || brief.length === 0) return null

    return (
        <div
            className={`saas-card bg-gradient-to-br from-indigo-50 via-white to-slate-50 border-l-4 border-l-indigo-600 p-6 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
        >
            <div className="flex items-center gap-2 mb-4">
                <span className="text-indigo-600 text-sm">✦</span>
                <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider">
                    AI Intelligence Brief
                </h3>
                <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full ml-auto">
                    AI-GENERATED
                </span>
            </div>

            <ul className="space-y-3">
                {brief.map((bullet, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                        <span className="text-indigo-400 font-bold shrink-0 mt-0.5">→</span>
                        <span>{bullet}</span>
                    </li>
                ))}
            </ul>

            {/* Sources + Disclaimer */}
            <div className="mt-4 pt-3 border-t border-indigo-100 flex flex-col gap-2">
                {sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                            Based on:
                        </span>
                        {sources.map((s) => (
                            <span
                                key={s.name}
                                className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full"
                            >
                                {s.name} ({s.count})
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-[11px] text-slate-400 italic">
                    This brief is machine-generated and may contain inaccuracies. Always verify claims with primary sources.
                </p>
            </div>
        </div>
    )
}
