"use client"

import { useState, useCallback } from "react"
import type { ResearchPaper } from "@/lib/research-client"
import { usePolling } from "@/hooks/usePolling"

interface ArxivSectionProps {
    // When provided, only display papers whose institutions list contains at least
    // one entry matching (case-insensitive substring) any name in this filter.
    institutionFilter?: string[]
}

export default function ArxivSection({ institutionFilter }: ArxivSectionProps = {}) {
    const transform = useCallback((json: Record<string, unknown>) => {
        const papers = json.papers as ResearchPaper[] | undefined
        return papers && papers.length > 0 ? papers : null
    }, [])

    const { data: rawPapers, loading } = usePolling<ResearchPaper[]>("/api/v1/research", {
        intervalMs: 600_000, // 10 minutes — research data changes slowly
        transform,
    })

    // Apply institution filter when provided
    const papers = rawPapers && institutionFilter && institutionFilter.length > 0
        ? rawPapers.filter((paper) =>
            paper.institutions.some((inst) =>
                institutionFilter.some((f) =>
                    inst.toLowerCase().includes(f.toLowerCase())
                )
            )
        )
        : rawPapers

    return (
        <section>
            <div className="flex items-center justify-between mb-1">
                <h2 className="section-header">Canadian AI Research</h2>
                {papers && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        {papers.length} papers
                    </span>
                )}
            </div>

            {loading && (
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm text-slate-500">Loading Canadian AI research...</div>
                </div>
            )}

            {!loading && papers && papers.length > 0 && (
                <div className="flex flex-col gap-3">
                    {papers.slice(0, 4).map((paper, i) => (
                        <PaperCard key={paper.id || i} paper={paper} />
                    ))}
                </div>
            )}

            {!loading && (!papers || papers.length === 0) && (
                <div className="saas-card p-6 text-center">
                    <p className="text-sm text-slate-500">Unable to fetch research data at this time.</p>
                </div>
            )}
        </section >
    )
}

function PaperCard({ paper }: { paper: ResearchPaper }) {
    const url = paper.openAccessUrl || paper.doiUrl || "#"

    return (
        <article className="saas-card bg-white p-4 border-l-4 border-l-purple-600">
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-slate-900 hover:text-indigo-700 hover:underline leading-snug block mb-2"
            >
                {paper.title}
            </a>

            {paper.summary && (
                <p className="text-xs text-slate-600 mb-2 leading-relaxed line-clamp-2">
                    {paper.summary}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="font-medium">
                    {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
                </span>
                <span className="text-slate-300">•</span>
                <span>{paper.publicationDate}</span>
                {paper.citationCount > 0 && (
                    <>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-amber-700">{paper.citationCount.toLocaleString()} citations</span>
                    </>
                )}
            </div>

            {/* Institution + journal badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {paper.institutions.slice(0, 2).map((inst) => (
                    <span key={inst} className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {inst}
                    </span>
                ))}
                {paper.journal && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {paper.journal.length > 35 ? paper.journal.slice(0, 35) + "…" : paper.journal}
                    </span>
                )}
            </div>
        </article>
    )
}
