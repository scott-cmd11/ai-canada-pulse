// frontend/src/app/blog/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { listDeepDives } from '@/lib/deep-dive-client'
import Header from '@/components/Header'

// Must be dynamic — content comes from Redis and updates throughout the day
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
        No deep dives yet — check back after a significant Canadian AI story breaks.
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
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                {entry.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {tag}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                {entry.title}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {displayDate} · {entry.readingTimeMinutes} min read · AI-generated
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
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px 60px' }}>
        <header style={{ padding: '32px 0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '8px' }}>
            Deep Dives
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Stories that earn a second look
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Auto-generated when a significant Canadian AI story crosses our detection threshold. One per day, maximum.
          </p>
        </header>
        <Suspense fallback={<div style={{ padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</div>}>
          <BlogList />
        </Suspense>
      </main>
    </div>
  )
}
