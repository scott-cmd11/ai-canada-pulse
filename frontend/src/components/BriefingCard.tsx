"use client"

import type { Story } from "@/lib/mock-data"
import { useStories } from "@/hooks/useStories"
import { relativeTime } from "@/lib/relative-time"
import { SkeletonBar } from '@/components/Skeleton'

export default function BriefingCard() {
  const { stories } = useStories()

  const topStory: Story | undefined = stories.find((s) => s.isBriefingTop) || stories[0]
  if (!topStory) {
    return (
      <article className="saas-card flex flex-col gap-5 border-l-[3px] p-6 sm:p-8" style={{ borderLeftColor: 'var(--border-subtle)' }}>
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

  return (
    <article
      className="saas-card flex flex-col gap-5 border-l-[3px] p-6 sm:p-8"
      style={{ borderLeftColor: 'var(--accent-primary)' }}
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
        <span>{topStory.category}</span>
        {topStory.sourceName && <span>| {topStory.sourceName}</span>}
        <span>| {topStory.region}</span>
      </div>

      <div className="space-y-3">
        <h3
          className="max-w-3xl text-2xl font-semibold leading-tight sm:text-[2rem]"
          style={{ color: 'var(--text-primary)' }}
        >
          {topStory.headline}
        </h3>

        {topStory.aiSummary ? (
          <p
            className="max-w-3xl text-sm leading-7 sm:text-[15px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="mr-1 text-xs" style={{ color: 'var(--accent-primary)' }}>*</span>
            {topStory.aiSummary}
          </p>
        ) : (
          <p
            className="max-w-3xl text-sm leading-7 sm:text-[15px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {topStory.summary}
          </p>
        )}
      </div>

      <div
        className="flex flex-wrap items-center gap-4 border-t pt-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
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
            className="text-sm font-semibold hover:underline"
            style={{ color: 'var(--accent-primary)' }}
          >
            Read primary source
          </a>
        )}
      </div>
    </article>
  )
}
