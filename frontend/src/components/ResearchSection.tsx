"use client"

import { useState, useEffect } from "react"
import type { ResearchPaper } from "@/lib/research-client"

export default function ResearchSection() {
  const [papers, setPapers] = useState<ResearchPaper[]>([])
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/research")
      .then((res) => res.json())
      .then((json) => {
        if (json.papers && json.papers.length > 0) {
          setPapers(json.papers)
        }
        if (json.fetchedAt) setFetchedAt(json.fetchedAt)
      })
      .catch((err) => console.warn("[ResearchSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  const lastUpdated = fetchedAt
    ? new Date(fetchedAt).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : null

  return (
    <section>
      <div className="section-header">
        <h2>Fundamental Research</h2>
      </div>

      {loading && (
        <div className="py-8">
          <p className="text-sm font-medium text-slate-500">Querying academic indices...</p>
        </div>
      )}

      {!loading && papers.length === 0 && (
        <div className="py-8">
          <p className="text-sm font-medium text-slate-500">No high-impact research identified for current period.</p>
        </div>
      )}

      {papers.length > 0 && (
        <div className="flex flex-col gap-4">
          {papers.slice(0, 4).map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-between items-center">
        {lastUpdated && (
          <p className="text-[11px] text-slate-400">
            Last updated: {lastUpdated}
          </p>
        )}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right ml-auto">
          Source: OpenAlex API
        </p>
      </div>
    </section>
  )
}

function PaperCard({ paper }: { paper: ResearchPaper }) {
  const link = paper.openAccessUrl || paper.doiUrl

  return (
    <article className="saas-card bg-white p-5 border-l-4 border-l-sky-600 flex flex-col">
      {paper.concepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {paper.concepts.slice(0, 3).map((c) => (
            <span
              key={c}
              className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-700 hover:underline"
          >
            {paper.title}
          </a>
        ) : (
          paper.title
        )}
      </h3>

      <div className="text-sm text-slate-600 leading-relaxed mb-2">
        {paper.authors.join(", ")}
        {paper.authors.length >= 5 && " et al."}
      </div>

      <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
        {paper.summary || "No summary available."}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-auto text-xs font-medium text-slate-500">
        {paper.institutions[0] && (
          <span className="truncate max-w-[250px]" title={paper.institutions.join(" / ")}>
            {paper.institutions[0]}
          </span>
        )}
        <span className="text-slate-300 hidden sm:block">•</span>
        {paper.journal && <span className="truncate max-w-[200px]">{paper.journal}</span>}
        <span className="text-slate-300 hidden sm:block">•</span>
        {paper.publicationDate && (
          <>
            <span>{paper.publicationDate}</span>
            <span className="text-slate-300 hidden sm:block">•</span>
          </>
        )}
        <span className="font-semibold text-slate-700 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {paper.citationCount.toLocaleString()} Citations
        </span>
      </div>
    </article>
  )
}
