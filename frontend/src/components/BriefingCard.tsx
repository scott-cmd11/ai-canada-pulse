"use client"

import { useState, useEffect } from "react"
import type { Story } from "@/lib/mock-data"

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
  const [topStory, setTopStory] = useState<Story | null>(null)

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((res) => res.json())
      .then((json) => {
        if (json.stories && json.stories.length > 0) {
          const top = (json.stories as Story[]).find((s) => s.isBriefingTop)
          if (top) setTopStory(top)
          else setTopStory(json.stories[0])
        }
      })
      .catch((err) => console.warn("[BriefingCard] fetch failed:", err))
  }, [])

  if (!topStory) return null

  return (
    <article className="saas-card bg-white p-6 sm:p-8 flex flex-col gap-4 border-l-4 border-l-indigo-600">

      {/* Dense Meta row */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="text-indigo-700">
          {topStory.category}
        </span>
        <span className="text-slate-300">•</span>
        {topStory.sourceName && (
          <>
            <span className="text-slate-700">{topStory.sourceName}</span>
            <span className="text-slate-300">•</span>
          </>
        )}
        <span>{topStory.region}</span>
      </div>

      {/* Fluid Headline */}
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
        {topStory.headline}
      </h3>

      {/* Readable Summary — prefer AI summary */}
      {topStory.aiSummary ? (
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          <span className="text-indigo-500 text-xs mr-1">✦</span>
          {topStory.aiSummary}
        </p>
      ) : (
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {topStory.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 mt-2">
        <p className="text-sm font-medium text-slate-500">
          {relativeTime(topStory.publishedAt)}
        </p>
        {topStory.sourceUrl && (
          <>
            <div className="w-px h-3 bg-slate-300"></div>
            <a
              href={topStory.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
            >
              Analyze source &rarr;
            </a>
          </>
        )}
      </div>
    </article>
  )
}
