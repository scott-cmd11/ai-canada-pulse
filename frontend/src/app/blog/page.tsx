// frontend/src/app/blog/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { listDeepDives } from '@/lib/deep-dive-client'
import Header from '@/components/Header'
import PageHero from '@/components/PageHero'

// Must be dynamic because content comes from Redis and updates throughout the day.
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
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
        No deep dives yet. Check back after a significant Canadian AI story breaks.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {entries.map((entry, i) => {
        const displayDate = new Date(entry.date + 'T12:00:00Z').toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        })
        return (
          <div key={entry.slug}>
            {i > 0 && <div style={{ height: '1px', background: 'var(--border-subtle)' }} />}
            <Link
              href={`/blog/${entry.slug}`}
              style={{ display: 'block', padding: '20px 0', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                {entry.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {tag}
                  </span>
                ))}
              </div>
              <p className="deep-dive-list-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.25 }}>
                {entry.title}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {displayDate} / {entry.readingTimeMinutes} min read / AI-generated
              </p>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main className="page-main-narrow">
        <PageHero
          eyebrow="Deep Dives"
          title={<>Stories with a <span>second look</span></>}
          description="Auto-generated when a significant Canadian AI story crosses the detection threshold. One per day, maximum, with source links for verification."
          stats={[
            { label: 'Format', value: 'Analysis' },
            { label: 'Cadence', value: 'Daily max' },
            { label: 'Label', value: 'AI' },
          ]}
        />
        <Suspense fallback={<div style={{ padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>}>
          <div className="page-section page-panel px-5 sm:px-6">
            <BlogList />
          </div>
        </Suspense>
      </main>
    </div>
  )
}
