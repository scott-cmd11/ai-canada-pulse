"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import SourceAttribution from '@/components/SourceAttribution'
import ScopeLabel from '@/components/ScopeLabel'
import { SkeletonStoryFeed } from '@/components/Skeleton'
import { useState, useCallback, useMemo, useEffect, Suspense } from "react"
import type { Category, Story } from "@/lib/mock-data"
import StoryCard from "./StoryCard"
import { useStories } from "@/hooks/useStories"
import { usePolling } from "@/hooks/usePolling"

const ALL = "All Signals"
const PAGE_SIZE = 4

const CATEGORIES: { value: typeof ALL | Category; label: string; slug: string }[] = [
  { value: ALL, label: "All", slug: "all" },
  { value: "Policy & Regulation", label: "Policy", slug: "policy" },
  { value: "Industry & Startups", label: "Markets", slug: "markets" },
  { value: "Research", label: "Research", slug: "research" },
]

const slugToValue = new Map(CATEGORIES.map((c) => [c.slug, c.value]))
const valueToSlug = new Map(CATEGORIES.map((c) => [c.value, c.slug]))

interface StoryFeedProps {
  region?: string
  sectionTitle?: string
}

// Next.js 14 requires useSearchParams() to be inside a Suspense boundary during
// static generation. Wrap the inner implementation so the dashboard page can
// still be statically analysed for metadata / prerender pass.
export default function StoryFeed(props: StoryFeedProps = {}) {
  return (
    <Suspense fallback={<SkeletonStoryFeed />}>
      <StoryFeedInner {...props} />
    </Suspense>
  )
}

function StoryFeedInner({ region, sectionTitle }: StoryFeedProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Only persist filter to the URL on the national dashboard feed. On province
  // pages the query string is already used for the region param; keep local.
  const syncToUrl = !region
  const urlCat = syncToUrl ? searchParams?.get('cat') ?? null : null
  const activeFromUrl = useMemo(() => {
    if (!urlCat) return ALL
    return slugToValue.get(urlCat) ?? ALL
  }, [urlCat])
  const active: typeof ALL | Category = syncToUrl ? activeFromUrl : ALL
  const [localActive, setLocalActive] = useState<typeof ALL | Category>(ALL)
  const effectiveActive = syncToUrl ? active : localActive
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  const setActive = (value: typeof ALL | Category) => {
    setDisplayCount(PAGE_SIZE)
    if (!syncToUrl) {
      setLocalActive(value)
      return
    }
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    const slug = valueToSlug.get(value)
    if (!slug || slug === 'all') params.delete('cat')
    else params.set('cat', slug)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

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

  // Region filter (client-only; national feed only). Canonical list of all
  // provinces + territories so a reader from Yukon can still filter even if
  // there's no story tagged there yet. "All" + "Canada" (national-scope items)
  // come first, then jurisdictions alphabetically.
  const [regionFilter, setRegionFilter] = useState<string>('All')
  const regionOptions = useMemo(() => {
    if (region) return []
    return [
      'All',
      'Canada',
      'Alberta',
      'British Columbia',
      'Manitoba',
      'New Brunswick',
      'Newfoundland and Labrador',
      'Northwest Territories',
      'Nova Scotia',
      'Nunavut',
      'Ontario',
      'Prince Edward Island',
      'Quebec',
      'Saskatchewan',
      'Yukon',
    ]
  }, [region])

  // "New since last visit" — count stories published after the timestamp
  // stored in localStorage from the previous session. Only shown on the
  // national dashboard feed (not region pages) and only for returning visitors.
  const LAST_VISIT_KEY = 'acp:last-visit'
  const [lastVisitAt, setLastVisitAt] = useState<number | null>(null)
  const [dismissedNewChip, setDismissedNewChip] = useState(false)
  useEffect(() => {
    if (region) return
    try {
      const raw = window.localStorage.getItem(LAST_VISIT_KEY)
      const parsed = raw ? parseInt(raw, 10) : NaN
      if (Number.isFinite(parsed)) setLastVisitAt(parsed)
      // Write "now" so the next visit compares against this one.
      window.localStorage.setItem(LAST_VISIT_KEY, Date.now().toString())
    } catch {
      // localStorage unavailable — quietly skip
    }
  }, [region])

  const newCount = useMemo(() => {
    if (!lastVisitAt || region) return 0
    return feedStories.filter((s) => {
      const t = new Date(s.publishedAt).getTime()
      return Number.isFinite(t) && t > lastVisitAt
    }).length
  }, [feedStories, lastVisitAt, region])

  const byCategory = effectiveActive === ALL
    ? feedStories
    : feedStories.filter((story) => story.category === effectiveActive)

  const filtered = !region && regionFilter !== 'All'
    ? byCategory.filter((story) => story.region === regionFilter)
    : byCategory

  const visible = filtered.slice(0, displayCount)

  return (
    <>
    {sectionTitle && (
      <h2 className="mb-4 text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
        {sectionTitle}
      </h2>
    )}
    <section className="rounded-[10px] border p-5 sm:p-6" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-elevated)' }}>
      <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-end lg:justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <p className="section-kicker" style={{ color: 'var(--text-muted)' }}>
            Curated Canada stream
          </p>
          <h3 className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>Signals worth scanning now</h3>
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


      {newCount > 0 && !dismissedNewChip && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setDismissedNewChip(true)}
            className="group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
              backgroundColor: 'var(--accent-surface)',
              color: 'var(--accent-primary)',
            }}
            aria-label={`${newCount} new ${newCount === 1 ? 'signal' : 'signals'} since your last visit - click to dismiss`}
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            />
            {newCount} new since your last visit
            <span aria-hidden className="opacity-50 group-hover:opacity-100">×</span>
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((category) => {
          const isActive = effectiveActive === category.value
          return (
            <button
              key={category.value}
              onClick={() => setActive(category.value)}
              aria-pressed={isActive}
              className="min-h-[36px] rounded-full border px-3 py-2 text-xs font-semibold transition-colors"
              style={isActive
                ? {
                    borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                    backgroundColor: 'var(--accent-surface)',
                    color: 'var(--accent-primary)',
                  }
                : {
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--surface-elevated)',
                    color: 'var(--text-muted)',
                  }
              }
            >
              {category.label}
            </button>
          )
        })}
        {!region && (
          <label className="ml-auto flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="hidden sm:inline font-semibold uppercase tracking-[0.14em]">Region</span>
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value)
                setDisplayCount(PAGE_SIZE)
              }}
              className="min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors"
              style={{
                borderColor: regionFilter === 'All' ? 'var(--border-subtle)' : 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                backgroundColor: regionFilter === 'All' ? 'var(--surface-elevated)' : 'var(--accent-surface)',
                color: regionFilter === 'All' ? 'var(--text-muted)' : 'var(--accent-primary)',
              }}
              aria-label="Filter stories by region"
            >
              {regionOptions.map((r) => (
                <option key={r} value={r}>{r === 'All' ? 'All regions' : r}</option>
              ))}
            </select>
          </label>
        )}
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
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Unable to load stories - check back shortly.</p>
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
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
            >
              Show more signals
            </button>
          ) : (
            <button
              onClick={() => setDisplayCount(PAGE_SIZE)}
              className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
            >
              Collapse
            </button>
          )}
        </div>
      )}
      <SourceAttribution sourceId="rss-news" lastUpdated={lastUpdated} />
    </section>
    </>
  )
}
