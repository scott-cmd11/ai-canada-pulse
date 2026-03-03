"use client"

import { useState, useEffect } from "react"
import type { HuggingFaceData } from "@/lib/huggingface-client"

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
                    <div className="animate-pulse text-sm text-slate-500">Loading Hugging Face data...</div>
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
            <p className="text-sm text-slate-600 mb-4 max-w-3xl leading-relaxed">
                AI models published by leading Canadian research organizations on Hugging Face Hub.
                Tracks model counts, total downloads, and top models from Cohere, Mila, and Vector Institute.
            </p>

            {/* KPI Row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="saas-card p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{data.totalModels.toLocaleString()}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Total Models</p>
                </div>
                <div className="saas-card p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{formatDownloads(data.totalDownloads)}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Total Downloads</p>
                </div>
            </div>

            {/* Org cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.orgs.filter(o => o.modelCount > 0).map((org) => (
                    <div key={org.orgSlug} className="saas-card p-5 border-l-4 border-l-amber-500">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900">{org.orgName}</h3>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {org.modelCount} models
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 mb-3">
                            {formatDownloads(org.totalDownloads)} downloads
                        </p>

                        {org.topModels.length > 0 && (
                            <div className="space-y-2">
                                {org.topModels.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between text-xs">
                                        <a
                                            href={`https://huggingface.co/${m.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-700 hover:underline font-medium truncate max-w-[70%]"
                                        >
                                            {m.id}
                                        </a>
                                        <span className="text-slate-400 shrink-0 ml-2">{formatDownloads(m.downloads)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                Source: Hugging Face Hub API · Updated every 30 min
            </p>
        </section>
    )
}

function formatDownloads(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}
