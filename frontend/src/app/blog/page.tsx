import { Suspense } from 'react'
import Link from 'next/link'
import { listDeepDives } from '@/lib/deep-dive-client'
import { fetchAllStories } from '@/lib/rss-client'
import type { Story } from '@/lib/mock-data'
import Header from '@/components/Header'

// Must be dynamic - content comes from Redis and updates throughout the day.
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Deep Dives',
    description: 'Auto-generated in-depth analysis of significant Canadian AI developments.',
    openGraph: { type: 'website' },
  }
}

async function BlogList() {
  const entries = await listDeepDives(20, 0)

  if (entries.length === 0) {
    const stories = await fetchAllStories().catch(() => [])

    return (
      <>
        <section className="editorial-empty">
          <div>
            <p className="section-kicker">Watching the threshold</p>
            <h2>No deep dives yet</h2>
            <p>
              Deep dives appear when a significant Canadian AI story earns longer analysis.
              Until then, the current signal stream is below.
            </p>
          </div>
          <Link href="/dashboard" className="briefing-action briefing-action--primary">
            Open live dashboard
          </Link>
        </section>
        <LatestSignals stories={stories.slice(0, 6)} />
      </>
    )
  }

  return (
    <section className="editorial-grid" aria-label="Deep dive archive">
      {entries.map((entry, i) => {
        const displayDate = new Date(entry.date + 'T12:00:00Z').toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        })
        return (
          <article key={entry.slug} className={i === 0 ? 'editorial-card editorial-card--feature' : 'editorial-card'}>
            <Link href={`/blog/${entry.slug}`} className="editorial-card__link">
              <div className="editorial-card__tags">
                {entry.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <h2>{entry.title}</h2>
              <p className="editorial-card__meta">
                {displayDate} / {entry.readingTimeMinutes} min read / AI-generated
              </p>
            </Link>
          </article>
        )
      })}
    </section>
  )
}

function LatestSignals({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null

  return (
    <section className="editorial-signals" aria-label="Latest live signals">
      <div className="editorial-signals__header">
        <div>
          <p className="section-kicker">Latest Signals</p>
          <h2>What the system is watching now</h2>
        </div>
        <Link href="/dashboard" className="primary-source-link">
          View full dashboard
        </Link>
      </div>
      <div className="editorial-signal-list">
        {stories.map((story) => (
          <a
            key={story.sourceUrl ?? story.id}
            href={story.sourceUrl ?? '/dashboard'}
            target={story.sourceUrl ? '_blank' : undefined}
            rel={story.sourceUrl ? 'noopener noreferrer' : undefined}
            className="editorial-signal"
          >
            <span>{story.category.replace('Industry & Startups', 'Markets')}</span>
            <strong>{story.headline}</strong>
            <small>{story.sourceName ?? story.region}</small>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main className="editorial-page">
        <header className="editorial-hero">
          <div>
            <p className="section-kicker">Deep Dives</p>
            <h1>Stories that earn a second look</h1>
            <p>
              Longer analysis for Canadian AI developments that cross the significance threshold.
              Built for context, source-checking, and sober follow-up.
            </p>
          </div>
          <aside className="editorial-hero__panel" aria-label="Deep dive publishing rules">
            <span>Publication rule</span>
            <strong>Maximum one per day</strong>
            <p>Generated only when the live signal stream has enough weight to justify a deeper brief.</p>
          </aside>
        </header>
        <Suspense fallback={<div className="editorial-loading">Loading...</div>}>
          <BlogList />
        </Suspense>
        <section className="editorial-path" aria-label="Reader path">
          <Link href="/" className="editorial-path__item">
            <span>Daily brief</span>
            <strong>Start with the digest</strong>
            <small>Fast context when you want the day in one pass.</small>
          </Link>
          <Link href="/dashboard" className="editorial-path__item">
            <span>Live index</span>
            <strong>Scan current signals</strong>
            <small>Source-linked developments, filters, and impact sections.</small>
          </Link>
          <Link href="/methodology" className="editorial-path__item">
            <span>Trust layer</span>
            <strong>Check the method</strong>
            <small>How sources, AI labels, and thresholds are handled.</small>
          </Link>
        </section>
      </main>
    </div>
  )
}
