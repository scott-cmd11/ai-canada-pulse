"use client"

import { useState, useEffect } from "react"
import type { ArxivData, ArxivPaper } from "@/lib/arxiv-client"

export default function ArxivSection() {
    const [data, setData] = useState<ArxivData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/v1/arxiv")
            .then((r) => r.json())
            .then((json) => { if (json.data) setData(json.data) })
            .finally(() => setLoading(false))
    }, [])

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="section-header">Canadian AI Pre-prints</h2>
                {data && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        {data.totalResults.toLocaleString()} total papers
                    </span>
                )}
            </div>

            {loading && (
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm text-slate-500">Loading arXiv data...</div>
                </div>
            )}

            {!loading && data && data.papers.length > 0 && (
                <div className="flex flex-col gap-3">
                    {data.papers.slice(0, 5).map((paper, i) => (
                        <PaperCard key={i} paper={paper} />
                    ))}
                </div>
            )}

            {!loading && (!data || data.papers.length === 0) && (
                <div className="saas-card p-6 text-center">
                    <p className="text-sm text-slate-500">Unable to fetch arXiv data at this time.</p>
                </div>
            )}

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                Source: arXiv.org API · Updated every 6 hrs
            </p>
        </section>
    )
}

function PaperCard({ paper }: { paper: ArxivPaper }) {
    return (
        <article className="saas-card bg-white p-4 border-l-4 border-l-purple-600">
            <a
                href={paper.arxivUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-slate-900 hover:text-indigo-700 hover:underline leading-snug block mb-2"
            >
                {paper.title}
            </a>

            <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                {paper.summary}...
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="font-medium">{paper.authors.join(", ")}{paper.authors.length >= 3 ? " et al." : ""}</span>
                <span className="text-slate-300">•</span>
                <span>{paper.published}</span>
                {paper.categories.slice(0, 2).map((cat) => (
                    <span key={cat} className="uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {cat}
                    </span>
                ))}
            </div>
        </article>
    )
}
