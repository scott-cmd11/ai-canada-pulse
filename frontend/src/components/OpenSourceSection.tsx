"use client"

import { useState, useEffect } from "react"
import type { HuggingFaceData } from "@/lib/huggingface-client"
import type { GitHubData } from "@/lib/github-client"

export default function OpenSourceSection() {
    const [hf, setHf] = useState<HuggingFaceData | null>(null)
    const [gh, setGh] = useState<GitHubData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch("/api/v1/huggingface").then((r) => r.json()),
            fetch("/api/v1/github").then((r) => r.json()),
        ])
            .then(([hfJson, ghJson]) => {
                if (hfJson.data) setHf(hfJson.data)
                if (ghJson.data) setGh(ghJson.data)
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <section>
            <h2 className="section-header mb-4">Open-Source AI Footprint</h2>

            {loading && (
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm text-slate-500">Loading open-source data...</div>
                </div>
            )}

            {!loading && (
                <>
                    {/* KPI Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <KPI label="HF Models" value={hf?.totalModels ?? 0} />
                        <KPI label="Total Downloads" value={formatNumber(hf?.totalDownloads ?? 0)} />
                        <KPI label="GitHub Repos" value={formatNumber(gh?.totalRepos ?? 0)} />
                        <KPI label="AI Developers" value={formatNumber(gh?.developerCount ?? 0)} />
                    </div>

                    {/* Org breakdown */}
                    {hf && hf.orgs.length > 0 && (
                        <div className="saas-card p-5 mb-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                                Canadian AI Organizations on Hugging Face
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {hf.orgs.map((org) => (
                                    <div key={org.orgSlug} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{org.orgName}</p>
                                            <p className="text-xs text-slate-500">{org.modelCount} models</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-indigo-700">{formatNumber(org.totalDownloads)}</p>
                                            <p className="text-[10px] text-slate-400 uppercase">downloads</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top GitHub repos */}
                    {gh && gh.topRepos.length > 0 && (
                        <div className="saas-card p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                                Top Canadian AI Repositories
                            </p>
                            <div className="flex flex-col gap-2">
                                {gh.topRepos.slice(0, 4).map((repo) => (
                                    <a
                                        key={repo.fullName}
                                        href={repo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{repo.fullName}</p>
                                            <p className="text-xs text-slate-500 truncate">{repo.description}</p>
                                        </div>
                                        <div className="flex items-center gap-1 ml-3 shrink-0">
                                            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-xs font-bold text-slate-700">{formatNumber(repo.stars)}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                        Source: Hugging Face Hub API, GitHub Search API
                    </p>
                </>
            )}
        </section>
    )
}

function KPI({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="saas-card p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-1">{label}</p>
        </div>
    )
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}
