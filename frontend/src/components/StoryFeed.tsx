"use client"

import Link from "next/link"
import { useState, useCallback } from "react"
import type { Category, Story } from "@/lib/mock-data"
import StoryCard from "./StoryCard"
import { useStories } from "@/hooks/useStories"
import { usePolling } from "@/hooks/usePolling"

const ALL = "All Signals"
const PAGE_SIZE = 4

const CATEGORIES: { value: typeof ALL | Category; label: string }[] = [
  { value: ALL, label: "All" },
  { value: "Policy & Regulation", label: "Policy" },
  { value: "Industry & Startups", label: "Markets" },
  { value: "Research", label: "Research" },
]

interface StoryFeedProps {
  region?: string
}

export default function StoryFeed({ region }: StoryFeedProps = {}) {
  const [active, setActive] = useState<typeof ALL | Category>(ALL)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  // Shared national context — used when no region prop is provided
  const sharedCtx = useStories()

  // Region-filtered polling — only active when region prop is provided.
  // usePolling is called unconditionally (rules of hooks), but the result is
  // only used when region is truthy.
  const regionUrl = region
    ? `/api/v1/stories?region=${encodeURIComponent(region)}`
    : "/api/v1/stories"
  const regionTransform = useCallback((json: Record<string, unknown>) => {
    return (json.stories as Story[] | undefined) ?? []
  }, [])
  const regionResult = usePolling<Story[]>(regionUrl, {
    intervalMs: 120_000,
    transform: regionTransform,
  })

  const stories = region ? (regionResult.data ?? []) : sharedCtx.stories
  const loading = region ? regionResult.loading : sharedCtx.loading

  const feedStories = stories.filter((story) => !story.isBriefingTop)

  const filtered = active === ALL
    ? feedStories
    : feedStories.filter((story) => story.category === active)

  const visible = filtered.slice(0, displayCount)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Curated Canada stream
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Signals worth scanning now</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            A narrower Canada feed focused on the items most relevant to acceleration, capacity building, and institutional impact.
          </p>
        </div>
        <Link href="/methodology" className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
          Source methodology
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => {
              setActive(category.value)
              setDisplayCount(PAGE_SIZE)
            }}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              active === category.value
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
            ].join(" ")}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {visible.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {loading && (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-slate-500">Retrieving Canada signals...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-slate-500">No signals in this view right now.</p>
        </div>
      )}

      {!loading && filtered.length > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Showing {visible.length} of {filtered.length} signals
          </p>
          {filtered.length > displayCount ? (
            <button
              onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Show more signals
            </button>
          ) : (
            <button
              onClick={() => setDisplayCount(PAGE_SIZE)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Collapse
            </button>
          )}
        </div>
      )}
    </section>
  )
}
