"use client"

import { useState, useEffect } from "react"
import type { ResearchPaper } from "@/lib/research-client"

export default function ResearchSection() {
  const [papers, setPapers] = useState<ResearchPaper[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/research")
      .then((res) => res.json())
      .then((json) => {
        if (json.papers && json.papers.length > 0) {
          setPapers(json.papers)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Canadian AI Research
      </h2>

      {loading && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Loading research papers from OpenAlex...</p>
        </div>
      )}

      {!loading && papers.length === 0 && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Unable to load research data at this time.</p>
        </div>
      )}

      {papers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {papers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}

      {papers.length > 0 && (
        <p className="text-[10px] text-slate-600 mt-2">
          Source: OpenAlex — open research database. Showing most-cited Canadian AI papers since 2024.
        </p>
      )}
    </section>
  )
}

function PaperCard({ paper }: { paper: ResearchPaper }) {
  const link = paper.openAccessUrl || paper.doiUrl

  return (
    <article className="bg-slate-800/60 rounded border border-slate-700/50 p-4 flex flex-col gap-2 card-hover">
      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-200 leading-snug line-clamp-3">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            {paper.title}
          </a>
        ) : (
          paper.title
        )}
      </h3>

      {/* Authors */}
      <p className="text-xs text-slate-500 line-clamp-1">
        {paper.authors.join(", ")}
        {paper.authors.length >= 5 && " et al."}
      </p>

      {/* Institutions */}
      {paper.institutions.length > 0 && (
        <p className="text-xs text-slate-400">
          {paper.institutions.join(" / ")}
        </p>
      )}

      {/* Concepts */}
      {paper.concepts.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {paper.concepts.map((c) => (
            <span
              key={c}
              className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-auto pt-1 text-xs">
        {paper.journal && (
          <span className="text-slate-500 truncate">{paper.journal}</span>
        )}
        <span className="text-slate-500 ml-auto whitespace-nowrap">
          {paper.citationCount} citations
        </span>
        {paper.publicationDate && (
          <span className="text-slate-600 whitespace-nowrap">
            {paper.publicationDate.slice(0, 7)}
          </span>
        )}
      </div>
    </article>
  )
}
