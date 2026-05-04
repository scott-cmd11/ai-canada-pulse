import Link from 'next/link'
import type { ReactNode } from 'react'

interface FreshnessNoticeProps {
  tone?: 'warning' | 'error'
  title: string
  children: ReactNode
}

export default function FreshnessNotice({ tone = 'warning', title, children }: FreshnessNoticeProps) {
  const accent = tone === 'error' ? 'var(--status-negative)' : 'var(--status-gold)'

  return (
    <div
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          border: `1px solid ${accent}`,
          background: `color-mix(in srgb, ${accent} 8%, var(--surface-primary))`,
          padding: '12px 14px',
        }}
      >
        <p
          style={{
            margin: '0 0 4px',
            color: accent,
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </p>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export function LatestHeadlinesLink() {
  return (
    <Link href="/dashboard" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
      Open the live dashboard
    </Link>
  )
}
