// frontend/src/components/DeepDiveView.tsx
// Server Component — renders a single DeepDive post.
// The body field is markdown — render it as HTML using a simple split-by-paragraph approach.
// No markdown library needed: body uses only paragraphs and blockquotes (> prefix).

import Link from 'next/link'
import type { DeepDive } from '@/lib/digest-types'

const TAG_COLORS: Record<string, string> = {
  Policy: '#3b82f6',
  Research: '#8b5cf6',
  Funding: '#10b981',
  Markets: '#f59e0b',
  Regulation: '#ef4444',
  Talent: '#06b6d4',
}

function renderBody(body: string) {
  // Split by double newline into paragraphs. Handle blockquotes (lines starting with >).
  const paragraphs = body.split(/\n\n+/).filter(Boolean)
  return paragraphs.map((para, i) => {
    const isBlockquote = para.startsWith('>')
    const text = isBlockquote ? para.replace(/^>\s*/gm, '') : para
    if (isBlockquote) {
      return (
        <blockquote
          key={i}
          style={{
            borderLeft: '3px solid var(--accent-primary)',
            padding: '12px 16px',
            margin: '20px 0',
            backgroundColor: `color-mix(in srgb, var(--accent-primary) 6%, var(--surface-primary))`,
            borderRadius: '0 6px 6px 0',
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: 1.65,
          }}
        >
          {text}
        </blockquote>
      )
    }
    return (
      <p key={i} style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.75, marginBottom: '16px' }}>
        {text}
      </p>
    )
  })
}

export default function DeepDiveView({ post }: { post: DeepDive }) {
  const displayDate = new Date(post.date + 'T12:00:00Z').toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <article className="page-main-narrow">
      {/* Back link */}
      <div style={{ padding: '24px 0 0' }}>
        <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Back to today&apos;s digest
        </Link>
      </div>

      {/* Post header */}
      <header style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {post.tags.map((tag) => {
            const color = TAG_COLORS[tag] ?? '#6b7280'
            return (
              <span
                key={tag}
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 12%, var(--surface-primary))`,
                  color,
                  border: `1px solid color-mix(in srgb, ${color} 20%, var(--surface-primary))`,
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            )
          })}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 3.5vw, 32px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}
        >
          {post.title}
        </h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>{post.readingTimeMinutes} min read</span>
          <span>AI-generated</span>
          <span>{displayDate}</span>
        </div>
      </header>

      {/* Body */}
      <section style={{ padding: '24px 0' }}>
        {renderBody(post.body)}
      </section>

      {/* Sources */}
      {post.sources.length > 0 && (
        <section style={{ padding: '20px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Sources
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {post.sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: 'var(--accent-primary)', textDecoration: 'none' }}
              >
                {source.source} — {source.headline}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Transparency note */}
      <div
        style={{
          margin: '0 0 32px',
          padding: '12px 16px',
          backgroundColor: 'var(--surface-secondary)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        This post was auto-generated because this story crossed our significance threshold:{' '}
        <em>{post.triggeredBy}</em>.{' '}
        <Link href="/methodology" style={{ color: 'var(--accent-primary)' }}>
          Learn how this works →
        </Link>
      </div>
    </article>
  )
}
