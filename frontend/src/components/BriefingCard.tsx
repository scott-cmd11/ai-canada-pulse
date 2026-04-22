"use client"

import type { Story } from "@/lib/mock-data"
import { useStories } from "@/hooks/useStories"
import { relativeTime } from "@/lib/relative-time"
import { SkeletonBar } from '@/components/Skeleton'
import AILabel from '@/components/AILabel'
import ShareButtons from '@/components/ShareButtons'

function isSummaryRedundant(headline: string, summary: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  const h = norm(headline)
  const s = norm(summary)
  if (s.length < 20) return true
  if (s.startsWith(h) || h.startsWith(s)) return true
  const hWords = h.split(/\s+/)
  const sWords = s.split(/\s+/)
  const sWordSet = new Set(sWords)
  let overlap = 0
  hWords.forEach(w => { if (sWordSet.has(w)) overlap++ })
  const allWords = new Set(hWords.concat(sWords))
  if (allWords.size > 0 && overlap / allWords.size > 0.6) return true
  return false
}

export default function BriefingCard() {
  const { stories, loading } = useStories()

  // Prefer a story with an AI summary for the lead signal — it's the most prominent card
  const topStory: Story | undefined =
    stories.find((s) => s.isBriefingTop && s.aiSummary) ||
    stories.find((s) => s.aiSummary) ||
    stories[0]

  if (loading) {
    return (
      <article className="saas-card accent-border-left flex flex-col gap-5 p-6 sm:p-8">
        <SkeletonBar width="80px" height="22px" />
        <div className="space-y-3">
          <SkeletonBar width="85%" height="28px" />
          <SkeletonBar width="100%" height="12px" />
          <SkeletonBar width="70%" height="12px" />
        </div>
        <SkeletonBar width="120px" height="12px" />
      </article>
    )
  }

  if (!topStory) {
    return (
      <article className="saas-card accent-border-left flex flex-col gap-5 p-6 sm:p-8">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Unable to load stories — check back shortly.
        </p>
      </article>
    )
  }

  return (
    <article
      className="saas-card accent-border-left flex flex-col gap-5 p-6 sm:p-8"
    >
      <div
        className="flex flex-wrap items-center gap-3 text-[11px] uppercase"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.16em', fontWeight: 700 }}
      >
        <span
          className="px-2.5 py-1"
          style={{
            background: 'var(--accent-primary)',
            color: '#fff',
            letterSpacing: '0.18em',
          }}
        >
          ▌ Lead Signal
        </span>
        {topStory.sourceName && <span style={{ color: 'var(--text-secondary)' }}>{topStory.sourceName}</span>}
        <span aria-hidden style={{ color: 'var(--border-strong)' }}>/</span>
        <span>{topStory.region}</span>
        {topStory.aiSummary && <AILabel level="classification" />}
      </div>

      <div className="space-y-3">
        <h3
          className="text-[clamp(24px,3.4vw,40px)] leading-[1.05] uppercase"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display), "Archivo Black", sans-serif',
            letterSpacing: '-0.01em',
          }}
        >
          {topStory.sourceUrl ? (
            <a
              href={topStory.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="story-headline-link"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {topStory.headline}
            </a>
          ) : (
            topStory.headline
          )}
        </h3>

        {topStory.aiSummary ? (
          <p
            className="line-clamp-3 text-sm leading-6 sm:text-[15px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {topStory.aiSummary}
          </p>
        ) : topStory.summary && !isSummaryRedundant(topStory.headline, topStory.summary) ? (
          <p
            className="line-clamp-3 text-sm leading-6 sm:text-[15px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {topStory.summary}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <p
          className="text-[11px] uppercase"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.16em', fontWeight: 700 }}
        >
          {relativeTime(topStory.publishedAt)}
        </p>
        {topStory.sourceUrl && (
          <a
            href={topStory.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-source-link text-sm font-semibold"
          >
            Read primary source →
          </a>
        )}
        {topStory.sourceUrl && (
          <ShareButtons url={topStory.sourceUrl} title={topStory.headline} />
        )}
      </div>
    </article>
  )
}
