'use client'

import Link from 'next/link'

interface AILabelProps {
  level: 'classification' | 'summary'
  sourceUrl?: string
  sourceName?: string
}

export default function AILabel({ level, sourceUrl, sourceName }: AILabelProps) {
  if (level === 'classification') {
    return (
      <Link
        href="/methodology#ai-processing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontFamily: 'var(--font-ui)',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent)',
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
          <path d="M5 3v2M5 6.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        AI-classified
      </Link>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-muted)',
        padding: '6px 0',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '8px',
      }}
    >
      <Link
        href="/methodology#ai-processing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--text-muted)',
          textDecoration: 'none',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
          <path d="M5 3v2M5 6.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        AI-generated summary
      </Link>
      {sourceUrl && (
        <>
          <span style={{ color: 'var(--border-subtle)' }}>·</span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
          >
            {sourceName || 'Source'} →
          </a>
        </>
      )}
    </div>
  )
}
