'use client'

import Link from 'next/link'
import { PROVINCES } from '@/lib/provinces-config'

// Sort by population descending
const sortedProvinces = [...PROVINCES].sort((a, b) => b.population - a.population)

// Section flag labels for dot indicators
const SECTION_FLAGS = ['stories', 'trends', 'jobs', 'stocks', 'research', 'parliament'] as const

export default function ProvinceIndex() {
  return (
    <div className="saas-card" style={{ padding: '24px', overflow: 'hidden' }}>
      {/* Header row */}
      <div
        className="province-index-header"
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr auto',
          gap: '12px',
          padding: '0 0 12px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '4px',
        }}
      >
        {['Province / Territory', 'AI Institute', 'Key University', 'Data', ''].map((label) => (
          <span
            key={label || 'arrow'}
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-ui)',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
            className={label === 'AI Institute' || label === 'Key University' || label === 'Data' ? 'province-index-hide-mobile' : ''}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Province rows */}
      {sortedProvinces.map((province) => {
        const institute = province.institutions.find((i) => i.type === 'institute')
        const university = province.institutions.find((i) => i.type === 'university')

        return (
          <Link
            key={province.slug}
            href={`/provinces/${province.slug}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr auto',
              gap: '12px',
              padding: '12px 0',
              borderBottom: '1px solid var(--border-subtle)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.15s',
            }}
            className="province-index-row"
          >
            {/* Province name + abbreviation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-primary)' }}>
                {province.name}
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
                }}
              >
                {province.abbreviation}
              </span>
            </div>

            {/* AI Institute */}
            <div className="province-index-hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
              {institute ? (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{institute.name}</span>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>
              )}
            </div>

            {/* Key University */}
            <div className="province-index-hide-mobile" style={{ display: 'flex', alignItems: 'center' }}>
              {university ? (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{university.name}</span>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>
              )}
            </div>

            {/* Data section dots */}
            <div className="province-index-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {SECTION_FLAGS.map((flag) => (
                <span
                  key={flag}
                  title={flag}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: province.sections[flag]
                      ? 'var(--accent-primary)'
                      : 'color-mix(in srgb, var(--text-muted) 20%, transparent)',
                  }}
                />
              ))}
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>→</span>
            </div>
          </Link>
        )
      })}

      {/* Mobile-hide CSS */}
      <style>{`
        .province-index-row:hover {
          background-color: var(--surface-secondary, rgba(0,0,0,0.02));
        }
        @media (max-width: 768px) {
          .province-index-hide-mobile { display: none !important; }
          .province-index-row {
            grid-template-columns: 1fr auto !important;
          }
          .province-index-header {
            grid-template-columns: 1fr auto !important;
          }
        }
      `}</style>
    </div>
  )
}
