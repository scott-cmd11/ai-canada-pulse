'use client'

import Link from 'next/link'
import { PROVINCES } from '@/lib/provinces-config'

export default function ProvinceIndexSection() {
  return (
    <div style={{ padding: '1.5rem 1.75rem 1.25rem' }}>
      {/* Header */}
      <div className="mb-5">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-1"
          style={{ color: 'var(--accent-primary)' }}
        >
          Provinces &amp; Territories
        </p>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          AI activity across Canada
        </h2>
      </div>

      {/* Column headers */}
      <div
        className="grid pb-2 mb-1"
        style={{
          gridTemplateColumns: 'minmax(0,2.2fr) minmax(0,1.8fr) 5rem',
          borderBottom: '1px solid var(--border-subtle)',
          columnGap: '1.25rem',
        }}
      >
        {(['Province / Territory', 'Description', ''].map((label, i) => (
          <span
            key={i}
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--text-muted)' }}
          >
            {label}
          </span>
        )))}
      </div>

      {/* Province rows */}
      <div role="list">
        {PROVINCES.map((province, idx) => (
          <Link
            key={province.slug}
            href={`/provinces/${province.slug}`}
            role="listitem"
            className="group block"
            style={{
              borderBottom: idx < PROVINCES.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div
              className="grid py-3 transition-colors duration-150"
              style={{
                gridTemplateColumns: 'minmax(0,2.2fr) minmax(0,1.8fr) 5rem',
                columnGap: '1.25rem',
                background: 'transparent',
              }}
            >
              {/* Name + abbreviation */}
              <div className="flex items-baseline gap-2.5 min-w-0">
                <span
                  className="text-[17px] leading-snug font-semibold group-hover:text-[color:var(--accent-primary)] transition-colors duration-150"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {province.name}
                </span>
                <span
                  className="shrink-0 text-[11px] font-bold tracking-wider"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  {province.abbreviation}
                </span>
              </div>

              {/* Description */}
              {/* Removed: aiHub */}
              <span
                className="self-center text-sm leading-snug"
                style={{ color: 'var(--text-secondary)' }}
              >
                {province.description}
              </span>

              {/* CTA */}
              <span
                className="self-center text-right text-sm font-medium group-hover:text-[color:var(--accent-primary)] transition-colors duration-150"
                style={{ color: 'var(--text-muted)' }}
              >
                View&nbsp;&rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
