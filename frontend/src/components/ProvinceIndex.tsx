'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PROVINCES } from '@/lib/provinces-config'

const sortedProvinces = [...PROVINCES].sort((a, b) => b.population - a.population)
const featured = sortedProvinces.slice(0, 5)
const remaining = sortedProvinces.slice(5)

export default function ProvinceIndex() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="saas-card" style={{ padding: '24px 28px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--accent-primary)',
              marginBottom: '6px',
            }}
          >
            Provincial Intelligence
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 3vw, 28px)',
              fontWeight: 600,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
            }}
          >
            Explore by Province
          </h2>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            padding: '4px 0',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.15s',
          }}
          className="province-toggle"
        >
          {expanded ? 'Show fewer \u2212' : `All ${sortedProvinces.length} regions +`}
        </button>
      </div>

      {/* Featured chips (top 5) */}
      <div className="province-chips">
        {featured.map((province, i) => {
          const institute = province.institutions.find((inst) => inst.type === 'institute')
          return (
            <Link
              key={province.slug}
              href={`/provinces/${province.slug}`}
              className="province-chip"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {province.name}
                </span>
                <span className="province-abbr">{province.abbreviation}</span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-ui)',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {institute ? institute.name : '\u2014'}
              </div>
              <span className="province-chip-arrow">&rarr;</span>
            </Link>
          )
        })}
      </div>

      {/* Expanded remaining chips */}
      {expanded && (
      <div
        className="province-expanded"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '8px',
          marginTop: '12px',
        }}
      >
        {remaining.map((province, i) => (
          <Link
            key={province.slug}
            href={`/provinces/${province.slug}`}
            className="province-chip-small"
            style={{ animationDelay: expanded ? `${i * 40}ms` : '0ms' }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {province.name}
            </span>
            <span className="province-abbr" style={{ fontSize: '9px' }}>{province.abbreviation}</span>
          </Link>
        ))}
      </div>
      )}

      <style>{`
        .province-chips {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .province-chips::-webkit-scrollbar { display: none; }

        @keyframes chipIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .province-chip {
          position: relative;
          flex: 1 0 160px;
          max-width: 220px;
          scroll-snap-align: start;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid var(--border-subtle);
          background: var(--surface-primary);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          opacity: 0;
          animation: chipIn 0.4s ease forwards;
        }
        .province-chip:hover {
          border-color: var(--accent-primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px color-mix(in srgb, var(--accent-primary) 10%, transparent);
        }
        .province-chip-arrow {
          position: absolute;
          top: 12px;
          right: 14px;
          font-size: 13px;
          color: var(--text-muted);
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.2s, transform 0.2s;
        }
        .province-chip:hover .province-chip-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .province-abbr {
          font-family: monospace;
          font-size: 10px;
          color: var(--text-muted);
          padding: 1px 5px;
          border-radius: 3px;
          background: color-mix(in srgb, var(--text-muted) 10%, transparent);
          flex-shrink: 0;
        }

        .province-chip-small {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          background: var(--surface-primary);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.2s, transform 0.15s;
          opacity: 0;
          animation: chipIn 0.3s ease forwards;
        }
        .province-chip-small:hover {
          border-color: var(--accent-primary);
          transform: translateY(-1px);
        }

        .province-toggle:hover { opacity: 0.7; }

        @media (max-width: 640px) {
          .province-chip { flex: 0 0 160px; }
          .province-expanded {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
