"use client"

import { useState, useEffect } from "react"
import type { ResearchPaper } from "@/lib/research-client"
import SourceAttribution from '@/components/SourceAttribution'
import { SkeletonTable } from '@/components/Skeleton'

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
        <div className="saas-card p-6"><SkeletonTable rows={4} /></div>
      )}

      {!loading && papers.length === 0 && (
        <div className="py-8">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No high-impact research identified for current period.</p>
        </div>
      )}

      {papers.length > 0 && (
        <div className="flex flex-col gap-4">
          {papers.slice(0, 4).map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}

      <SourceAttribution sourceId="openalex" lastUpdated={lastUpdated} />
    </section>
  )
}

function PaperCard({ paper }: { paper: ResearchPaper }) {
  const link = paper.openAccessUrl || paper.doiUrl

  return (
    <article className="saas-card p-5 border-l-4 border-l-sky-600 flex flex-col" style={{ backgroundColor: 'var(--surface-primary)' }}>
      {paper.concepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {paper.concepts.slice(0, 3).map((c) => (
            <span
              key={c}
              className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded"
              style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <h3 className="text-base font-bold leading-snug mb-2" style={{ color: 'var(--text-primary)' }}>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          >
            {paper.title}
          </a>
        ) : (
          paper.title
        )}
      </h3>

      <div className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
        {paper.authors.join(", ")}
        {paper.authors.length >= 5 && " et al."}
      </div>

      <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
        {paper.summary || "No summary available."}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-auto text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {paper.institutions[0] && (
          <span className="truncate max-w-[250px]" title={paper.institutions.join(" / ")}>
            {paper.institutions[0]}
          </span>
        )}
        <span className="hidden sm:block" style={{ color: 'var(--border-subtle)' }}>•</span>
        {paper.journal && <span className="truncate max-w-[200px]">{paper.journal}</span>}
        <span className="hidden sm:block" style={{ color: 'var(--border-subtle)' }}>•</span>
        {paper.publicationDate && (
          <>
            <span>{paper.publicationDate}</span>
            <span className="hidden sm:block" style={{ color: 'var(--border-subtle)' }}>•</span>
          </>
        )}
        <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {paper.citationCount.toLocaleString()} Citations
        </span>
      </div>
    </article>
  )
}
