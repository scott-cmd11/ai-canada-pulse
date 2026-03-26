'use client'

import Link from 'next/link'
import { getProvinceBySlug } from '@/lib/provinces-config'

interface ProvincePreviewPanelProps {
  slug: string | null
}

export default function ProvincePreviewPanel({ slug }: ProvincePreviewPanelProps) {
  const province = slug ? getProvinceBySlug(slug) : undefined

  const panelStyle: React.CSSProperties = {
    width: '320px',
    flexShrink: 0,
    background: 'var(--surface-primary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '28px',
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: province ? 'flex-start' : 'center',
    boxShadow: 'var(--shadow-soft)',
    transition: 'box-shadow 0.2s ease',
  }

  if (!province) {
    return (
      <div style={panelStyle}>
        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            lineHeight: 1.5,
          }}
        >
          Hover over a province to see details
        </p>
      </div>
    )
  }

  const topInstitutions = province.institutions.slice(0, 3)

  return (
    <div style={panelStyle}>
      {/* Province name */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.15,
          marginBottom: '10px',
          letterSpacing: '-0.5px',
        }}
      >
        {province.name}
      </h3>

      {/* Capital + population */}
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-ui)',
          marginBottom: '8px',
          lineHeight: 1.4,
        }}
      >
        {province.capital} &middot; {province.population}M residents
      </p>

      {/* AI Hub */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-ui)',
          marginBottom: '16px',
        }}
      >
        AI Hub: {province.aiHub}
      </p>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'var(--border-subtle)',
          marginBottom: '16px',
        }}
      />

      {/* Top institutions */}
      {topInstitutions.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              marginBottom: '10px',
            }}
          >
            Key Institutions
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {topInstitutions.map((inst) => (
              <li
                key={inst.name}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-ui)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    flexShrink: 0,
                  }}
                />
                {inst.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Spacer to push link to bottom */}
      <div style={{ flex: 1 }} />

      {/* View full profile link */}
      <Link
        href={`/provinces/${province.slug}`}
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--accent-primary)',
          fontFamily: 'var(--font-ui)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px',
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
      >
        View full profile
        <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>&rarr;</span>
      </Link>
    </div>
  )
}
