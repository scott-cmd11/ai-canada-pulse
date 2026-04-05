// frontend/src/components/DigestView.tsx
// Server Component — renders a DailyDigest.
// Used by the homepage (/) and archive pages (/digest/[date]).
// No client state — all data is passed as props from the Server Component parent.

import Link from 'next/link'
import type { DailyDigest } from '@/lib/digest-types'

function TagBadge({ tag }: { tag: string }) {
  return (
    <span
      style={{
        backgroundColor: 'var(--surface-secondary, var(--surface-primary))',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '4px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.03em',
      }}
    >
      {tag}
    </span>
  )
}

interface Props {
  digest: DailyDigest
  isToday: boolean
}

export default function DigestView({ digest, isToday }: Props) {
  const displayDate = new Date(digest.date + 'T12:00:00Z').toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  // Compute previous and next date strings for archive nav
  const currentDate = new Date(digest.date + 'T12:00:00Z')
  const prevDate = new Date(currentDate)
  prevDate.setUTCDate(prevDate.getUTCDate() - 1)
  const nextDate = new Date(currentDate)
  nextDate.setUTCDate(nextDate.getUTCDate() + 1)
  const prevISO = prevDate.toISOString().split('T')[0]
  const nextISO = nextDate.toISOString().split('T')[0]
  const todayISO = new Date().toISOString().split('T')[0]
  const hasNext = nextISO <= todayISO && !isToday

  return (
    <article style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>
      {/* Date + heading */}
      <header style={{ padding: '32px 0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: '10px',
          }}
        >
          {displayDate} · {isToday ? 'Today\'s Digest' : 'Archive'}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}
        >
          {digest.headline}
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '16px',
          }}
        >
          {digest.intro}
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {digest.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
        <p style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
          AI-generated digest · may contain errors · verify with linked sources
        </p>
      </header>

      {/* Key Developments */}
      <section style={{ padding: '24px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '16px',
          }}
        >
          Key Developments
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {digest.developments.map((dev, i) => {
            return (
              <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--text-muted)',
                    marginTop: '8px',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                  {dev.text}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Top Stories */}
      {digest.topStories.length > 0 && (
        <section style={{ padding: '24px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '14px',
            }}
          >
            Top Stories
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {digest.topStories.map((story, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: '1px', background: 'var(--border-subtle)' }} />}
                <a
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <span>{story.headline}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    {story.source} →
                  </span>
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Deep Dive callout */}
      {digest.deepDiveSlug && (
        <section
          style={{
            padding: '16px 20px',
            margin: '0 -20px',
            backgroundColor: `color-mix(in srgb, var(--accent-primary) 6%, var(--surface-primary))`,
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '4px' }}>
            Deep Dive
          </p>
          <Link
            href={`/blog/${digest.deepDiveSlug}`}
            style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
          >
            Read today&apos;s in-depth analysis →
          </Link>
        </section>
      )}

      {/* Archive nav + Dashboard link */}
      <footer style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
        <Link href={`/digest/${prevISO}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← {prevDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
        </Link>
        <Link href="/dashboard" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
          Explore Dashboard →
        </Link>
        {hasNext && (
          <Link href={`/digest/${nextISO}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            {nextDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' })} →
          </Link>
        )}
      </footer>
    </article>
  )
}
