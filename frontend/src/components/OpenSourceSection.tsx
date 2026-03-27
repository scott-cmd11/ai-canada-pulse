"use client"

import { useState, useEffect } from "react"
import type { GitHubData } from "@/lib/github-client"
import SourceAttribution from '@/components/SourceAttribution'
import { SectionSkeleton } from '@/components/Skeleton'

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
            <p className="text-sm mb-4 max-w-3xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Top Canadian AI repositories by stars. Summaries are extracted from each project&apos;s README to provide context on what each repository does and its relevance to the Canadian AI ecosystem.
            </p>

            {loading && (
                <SectionSkeleton title="Canadian AI on GitHub" variant="cards" />
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
                                    className="saas-card p-5 hover:shadow-md transition-all group border-l-4 border-l-sky-600"
                                    style={{ ['--hover-border' as string]: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'
                                        const title = e.currentTarget.querySelector<HTMLElement>('[data-repo-title]')
                                        if (title) title.style.color = 'var(--accent-primary)'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = ''
                                        const title = e.currentTarget.querySelector<HTMLElement>('[data-repo-title]')
                                        if (title) title.style.color = 'var(--text-primary)'
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate" data-repo-title style={{ color: 'var(--text-primary)' }}>
                                                {repo.fullName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 ml-3 shrink-0">
                                            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{formatNumber(repo.stars)}</span>
                                        </div>
                                    </div>

                                    <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
                                        {repo.readmeExcerpt || repo.description || "No description available."}
                                    </p>

                                    {/* Metadata row */}
                                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {repo.language && repo.language !== "Unknown" && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }}></span>
                                                {repo.language}
                                            </span>
                                        )}
                                        {repo.topics.length > 0 && (
                                            <div className="flex gap-1">
                                                {repo.topics.slice(0, 3).map((t) => (
                                                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-muted)' }}>
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

                    <SourceAttribution sourceId="github" />
                </>
            )}
        </section>
    )
}

function KPI({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="saas-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
        </div>
    )
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}
