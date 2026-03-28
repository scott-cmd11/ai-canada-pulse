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
            className={`saas-card border-l-4 p-6 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
            style={{ borderLeftColor: 'var(--accent-primary)' }}
        >
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm" style={{ color: 'var(--accent-primary)' }}>✦</span>
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                    AI Intelligence Brief
                </h3>
                <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto border"
                    style={{
                        color: 'var(--accent-primary)',
                        backgroundColor: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                    }}
                >
                    AI-GENERATED
                </span>
            </div>

            <ul className="space-y-3">
                {brief.map((bullet, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        <span className="font-bold shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }}>→</span>
                        <span>{bullet}</span>
                    </li>
                ))}
            </ul>

            {/* Sources + Disclaimer */}
            <div className="mt-4 pt-3 border-t flex flex-col gap-2" style={{ borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}>
                {sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider mr-1" style={{ color: 'var(--text-muted)' }}>
                            Based on:
                        </span>
                        {sources.map((s) => (
                            <span
                                key={s.name}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                                style={{
                                    color: 'var(--text-muted)',
                                    backgroundColor: 'var(--surface-secondary)',
                                    borderColor: 'var(--border-subtle)',
                                }}
                            >
                                {s.name} ({s.count})
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                    This brief is machine-generated and may contain inaccuracies. Always verify claims with primary sources.
                </p>
            </div>
        </div>
    )
}
