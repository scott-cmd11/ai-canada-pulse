"use client"

import { useState, useEffect } from "react"

interface Props {
    brief: string[] | null
}

export default function IntelligenceBrief({ brief }: Props) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (brief && brief.length > 0) {
            // Slight delay for smooth appearance
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
        </div>
    )
}
