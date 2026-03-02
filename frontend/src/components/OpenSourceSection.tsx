"use client"

import { useState, useEffect } from "react"
import type { GitHubData } from "@/lib/github-client"

export default function OpenSourceSection() {
    const [gh, setGh] = useState<GitHubData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/v1/github")
            .then((r) => r.json())
            .then((json) => { if (json.data) setGh(json.data) })
            .finally(() => setLoading(false))
    }, [])

    return (
        <section>
            <div className="section-header">
                <h2>Canadian AI on GitHub</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4 max-w-3xl leading-relaxed">
                Top Canadian AI repositories by stars. Summaries are extracted from each project&apos;s README to provide context on what each repository does and its relevance to the Canadian AI ecosystem.
            </p>

            {loading && (
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm text-slate-500">Loading GitHub data...</div>
                </div>
            )}

            {!loading && gh && (
                <>
                    {/* KPI Row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <KPI label="GitHub Repos" value={formatNumber(gh.totalRepos)} />
                        <KPI label="AI Developers" value={formatNumber(gh.developerCount)} />
                    </div>

                    {/* Top repos with README summaries */}
                    {gh.topRepos.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {gh.topRepos.slice(0, 6).map((repo) => (
                                <a
                                    key={repo.fullName}
                                    href={repo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="saas-card p-5 hover:shadow-md hover:border-indigo-200 transition-all group border-l-4 border-l-sky-600"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                                                {repo.fullName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 ml-3 shrink-0">
                                            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-xs font-bold text-slate-700">{formatNumber(repo.stars)}</span>
                                        </div>
                                    </div>

                                    {/* README-based summary (preferred) or fallback to description */}
                                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-3">
                                        {repo.readmeExcerpt || repo.description || "No description available."}
                                    </p>

                                    {/* Metadata row */}
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        {repo.language && repo.language !== "Unknown" && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                                {repo.language}
                                            </span>
                                        )}
                                        {repo.topics.length > 0 && (
                                            <div className="flex gap-1">
                                                {repo.topics.slice(0, 3).map((t) => (
                                                    <span key={t} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-500">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}

                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                        Source: GitHub Search API · Updated every 6 hrs
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
