"use client"

import type { Story } from "@/lib/mock-data"
import { useStories } from "@/hooks/useStories"
import { relativeTime } from "@/lib/relative-time"

export default function BriefingCard() {
  const { stories } = useStories()

  const topStory: Story | undefined = stories.find((s) => s.isBriefingTop) || stories[0]
  if (!topStory) return null

  return (
    <article className="saas-card flex flex-col gap-5 border-l-[3px] border-l-indigo-600 bg-white/95 p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">
          Lead signal
        </span>
        <span>{topStory.category}</span>
        {topStory.sourceName && <span>| {topStory.sourceName}</span>}
        <span>| {topStory.region}</span>
      </div>

      <div className="space-y-3">
        <h3 className="max-w-3xl text-2xl font-semibold leading-tight text-slate-950 sm:text-[2rem]">
          {topStory.headline}
        </h3>

        {topStory.aiSummary ? (
          <p className="max-w-3xl text-sm leading-7 text-slate-700 sm:text-[15px]">
            <span className="mr-1 text-xs text-indigo-500">*</span>
            {topStory.aiSummary}
          </p>
        ) : (
          <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
            {topStory.summary}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          {relativeTime(topStory.publishedAt)}
        </p>
        {topStory.sourceUrl && (
          <a
            href={topStory.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
          >
            Read primary source
          </a>
        )}
      </div>
    </article>
  )
}
