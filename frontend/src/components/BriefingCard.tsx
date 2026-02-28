"use client"

import { useState, useEffect } from "react"
import type { Story } from "@/lib/mock-data"

const sentimentConfig: Record<string, { label: string; color: string }> = {
  positive: { label: "Positive", color: "#10b981" },
  neutral: { label: "Neutral", color: "#64748b" },
  concerning: { label: "Negative", color: "#ef4444" },
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "just now"
  if (diff === 1) return "1 min ago"
  if (diff < 60) return `${diff} min ago`
  const h = Math.floor(diff / 60)
  if (h < 24) return h === 1 ? "1 hr ago" : `${h} hrs ago`
  const d = Math.floor(h / 24)
  return d === 1 ? "1 day ago" : `${d} days ago`
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

  const sent = sentimentConfig[topStory.sentiment] ?? sentimentConfig.neutral

  return (
    <div>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Top Story
      </h2>

      <article className="bg-slate-800/60 rounded border border-slate-700/50 p-5 sm:p-6 flex flex-col gap-3">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">{topStory.category}</span>
          <span className="text-slate-600">|</span>
          <span className="font-medium" style={{ color: sent.color }}>{sent.label}</span>
          {topStory.sourceName && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500">{topStory.sourceName}</span>
            </>
          )}
          <span className="ml-auto text-slate-500">{topStory.region}</span>
        </div>

        {/* Headline */}
        <h3 className="text-lg sm:text-xl font-semibold text-slate-100 leading-snug">
          {topStory.headline}
        </h3>

        {/* Summary */}
        <p className="text-sm text-slate-400 leading-relaxed">
          {topStory.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">{relativeTime(topStory.publishedAt)}</p>
          {topStory.sourceUrl && (
            <a
              href={topStory.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Read full story &#8599;
            </a>
          )}
        </div>
      </article>
    </div>
  )
}
