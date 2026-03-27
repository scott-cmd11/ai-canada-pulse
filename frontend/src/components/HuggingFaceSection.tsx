"use client"

import { useState, useEffect } from "react"
import type { HuggingFaceData } from "@/lib/huggingface-client"
import SourceAttribution from '@/components/SourceAttribution'

export default function HuggingFaceSection() {
    const [data, setData] = useState<HuggingFaceData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/v1/huggingface")
            .then((r) => r.json())
            .then((json) => { if (json.data) setData(json.data) })
            .catch((err) => console.warn("[HuggingFaceSection] fetch failed:", err))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <section>
                <div className="section-header"><h2>Canadian AI Models</h2></div>
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>Loading Hugging Face data...</div>
                </div>
            </section>
        )
    }

    if (!data || data.orgs.length === 0) return null

    return (
        <section>
            <div className="section-header">
                <h2>Canadian AI Models</h2>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="saas-card p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.totalModels.toLocaleString()}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Total Models</p>
                </div>
                <div className="saas-card p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatDownloads(data.totalDownloads)}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Total Downloads</p>
                </div>
            </div>

            {/* Org cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.orgs.filter(o => o.modelCount > 0).map((org) => (
                    <div key={org.orgSlug} className="saas-card p-5 border-l-4 border-l-amber-500">
                        <div className="flex items-center justify-between mb-1">
                            <a
                                href={`https://huggingface.co/${org.orgSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-bold hover:underline"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                            >
                                {org.orgName}
                            </a>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded border" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
                                {org.modelCount} models
                            </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDownloads(org.totalDownloads)} downloads
                        </p>
                    </div>
                ))}
            </div>
            <SourceAttribution sourceId="huggingface" />
        </section>
    )
}

function formatDownloads(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}
