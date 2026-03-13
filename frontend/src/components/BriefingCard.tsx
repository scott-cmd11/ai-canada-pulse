"use client"

import { useCallback } from "react"
import type { Story } from "@/lib/mock-data"
import { usePolling } from "@/hooks/usePolling"

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "Just updated"
  if (diff === 1) return "1m ago"
  if (diff < 60) return `${diff}m ago`
  const h = Math.floor(diff / 60)
  if (h < 24) return h === 1 ? "1h ago" : `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? "1d ago" : `${d}d ago`
}

export default function BriefingCard() {
  const transform = useCallback((json: Record<string, unknown>) => {
    const stories = json.stories as Story[] | undefined
    if (!stories || stories.length === 0) return null
    const top = stories.find((s) => s.isBriefingTop)
    return top || stories[0]
  }, [])

  const { data: topStory } = usePolling<Story>("/api/v1/stories", {
    intervalMs: 120_000,
    transform,
  })

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