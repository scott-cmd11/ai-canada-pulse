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
        className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: 'var(--text-muted)' }}
      >
        <span
          className="rounded-full px-2.5 py-1"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
            color: 'var(--accent-primary)',
          }}
        >
          Lead signal
        </span>
        {topStory.sourceName && <span>| {topStory.sourceName}</span>}
        <span>| {topStory.region}</span>
        {topStory.aiSummary && <AILabel level="classification" />}
      </div>

      <div className="space-y-3">
        <h3
          className="text-2xl font-semibold leading-tight sm:text-[2rem]"
          style={{ color: 'var(--text-primary)' }}
        >
          {topStory.headline}
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

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <p
          className="text-xs font-medium uppercase tracking-[0.14em]"
          style={{ color: 'var(--text-muted)' }}
        >
          {relativeTime(topStory.publishedAt)}
        </p>
        {topStory.sourceUrl && (
          <a
            href={topStory.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold hover:underline focus-visible:underline focus-visible:outline-none"
            style={{ color: 'var(--accent-primary)', transition: 'opacity 0.15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Read primary source
          </a>
        )}
        {topStory.sourceUrl && (
          <ShareButtons url={topStory.sourceUrl} title={topStory.headline} />
        )}
      </div>
    </article>
  )
}
