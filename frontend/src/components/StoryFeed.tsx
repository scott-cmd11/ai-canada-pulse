"use client"

import Link from "next/link"
import SourceAttribution from '@/components/SourceAttribution'
import ScopeLabel from '@/components/ScopeLabel'
import { SkeletonStoryFeed } from '@/components/Skeleton'
import { useState, useCallback } from "react"
import type { Category, Story } from "@/lib/mock-data"
import StoryCard from "./StoryCard"
import { useStories } from "@/hooks/useStories"
import { usePolling } from "@/hooks/usePolling"
import SectionSummary from '@/components/SectionSummary'

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
  const [regionSummary, setRegionSummary] = useState<string | null>(null)
  const regionTransform = useCallback((json: Record<string, unknown>) => {
    setRegionSummary((json.summary as string | undefined) ?? null)
    return (json.stories as Story[] | undefined) ?? []
  }, [])
  const regionIsEmpty = useCallback((d: Story[]) => Array.isArray(d) && d.length === 0, [])
  const regionResult = usePolling<Story[]>(regionUrl, {
    intervalMs: 120_000,
    transform: regionTransform,
    fallbackUrl: region ? '/api/v1/stories' : undefined,
    isEmpty: regionIsEmpty,
  })

  const stories = region ? (regionResult.data ?? []) : sharedCtx.stories
  const loading = region ? regionResult.loading : sharedCtx.loading
  const summary = region ? regionSummary : sharedCtx.summary
  const { isFallback, lastUpdated } = regionResult

  // On province pages, hide the section entirely rather than showing national fallback stories
  if (region && isFallback) return null

  const feedStories = stories.filter((story) => !story.isBriefingTop)

  const filtered = active === ALL
    ? feedStories
    : feedStories.filter((story) => story.category === active)

  const visible = filtered.slice(0, displayCount)

  return (
    <section className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-primary)' }}>
      <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-end lg:justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
            Curated Canada stream
          </p>
          <h3 className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Signals worth scanning now</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            A narrower Canada feed focused on the items most relevant to acceleration, capacity building, and institutional impact.
          </p>
        </div>
        <Link href="/methodology" className="text-sm font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
          Source methodology
        </Link>
      </div>

      {region && (
        <div className="mt-4">
          <ScopeLabel provinceName={region} isFallback={isFallback} dataType="stories" />
        </div>
      )}

      {!region && <SectionSummary summary={summary} />}

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => {
              setActive(category.value)
              setDisplayCount(PAGE_SIZE)
            }}
            className="min-h-[36px] rounded-full border px-3 py-2 text-xs font-semibold transition-colors"
            style={active === category.value
              ? {
                  borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
                  color: 'var(--accent-primary)',
                }
              : {
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--surface-primary)',
                  color: 'var(--text-muted)',
                }
            }
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {visible.map((story) => (
          <StoryCard key={story.sourceUrl || story.id} story={story} />
        ))}
      </div>

      {loading && visible.length === 0 && (
        <div className="mt-4">
          <SkeletonStoryFeed count={3} />
        </div>
      )}

      {!loading && stories.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Unable to load stories — check back shortly.</p>
        </div>
      )}

      {!loading && stories.length > 0 && filtered.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No signals in this view right now.</p>
        </div>
      )}

      {!loading && filtered.length > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Showing {visible.length} of {filtered.length} signals
          </p>
          {filtered.length > displayCount ? (
            <button
              onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
              className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-primary)', color: 'var(--text-secondary)' }}
            >
              Show more signals
            </button>
          ) : (
            <button
              onClick={() => setDisplayCount(PAGE_SIZE)}
              className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-primary)', color: 'var(--text-secondary)' }}
            >
              Collapse
            </button>
          )}
        </div>
      )}
      <SourceAttribution sourceId="rss-news" lastUpdated={lastUpdated} />
    </section>
  )
}
