'use client'

import { useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const canada = require('@svg-maps/canada').default as {
  label: string
  viewBox: string
  locations: Array<{ id: string; name: string; path: string }>
}

interface CanadaMapProps {
  onProvinceHover: (slug: string | null) => void
  onProvinceClick: (slug: string) => void
  activeSlug: string | null
}

// Map the @svg-maps/canada location IDs to our province config slugs
const ID_TO_SLUG: Record<string, string> = {
  ab: 'alberta',
  bc: 'british-columbia',
  mb: 'manitoba',
  nb: 'new-brunswick',
  nl: 'newfoundland-labrador',
  nt: 'northern-territories',
  ns: 'nova-scotia',
  nu: 'northern-territories',
  on: 'ontario',
  pe: 'prince-edward-island',
  qc: 'quebec',
  sk: 'saskatchewan',
  yt: 'northern-territories',
}

const ABBR_LABELS: Record<string, string> = {
  ab: 'AB',
  bc: 'BC',
  mb: 'MB',
  nb: 'NB',
  nl: 'NL',
  ns: 'NS',
  on: 'ON',
  pe: 'PE',
  qc: 'QC',
  sk: 'SK',
  // Territories share one label — rendered separately
}

// Approximate label positions (centroid-ish) for each location within viewBox 0 0 793 1032
const LABEL_POS: Record<string, { x: number; y: number }> = {
  ab: { x: 248, y: 840 },
  bc: { x: 160, y: 830 },
  mb: { x: 420, y: 850 },
  nb: { x: 690, y: 990 },
  nl: { x: 720, y: 850 },
  ns: { x: 725, y: 1005 },
  on: { x: 545, y: 960 },
  pe: { x: 710, y: 970 },
  qc: { x: 620, y: 870 },
  sk: { x: 330, y: 840 },
}

// IDs that make up the "northern-territories" combined slug
const TERRITORY_IDS = new Set(['nt', 'nu', 'yt'])

export default function CanadaMap({ onProvinceHover, onProvinceClick, activeSlug }: CanadaMapProps) {
  // Split locations into territories (back layer) and provinces (front layer)
  const { territories, provinces } = useMemo(() => {
    const t: typeof canada.locations = []
    const p: typeof canada.locations = []
    for (const loc of canada.locations) {
      if (TERRITORY_IDS.has(loc.id)) t.push(loc)
      else p.push(loc)
    }
    return { territories: t, provinces: p }
  }, [])

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={canada.viewBox}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Interactive map of Canada by province and territory"
        role="img"
      >
        <defs>
          <style>{`
            .prov-path {
              transition: fill 0.2s ease, fill-opacity 0.2s ease, stroke 0.2s ease;
            }
            .prov-path:hover {
              fill: var(--accent-primary) !important;
              fill-opacity: 0.4 !important;
              stroke: var(--accent-primary) !important;
              stroke-width: 1.5 !important;
            }
            .prov-lbl {
              font-family: var(--font-ui, system-ui, sans-serif);
              font-size: 14px;
              font-weight: 700;
              pointer-events: none;
              user-select: none;
              letter-spacing: 0.06em;
            }
          `}</style>
        </defs>

        {/* Territory paths (back layer, subtle) */}
        {territories.map((loc) => {
          const slug = ID_TO_SLUG[loc.id]!
          const isActive = activeSlug === slug
          return (
            <path
              key={loc.id}
              d={loc.path}
              className="prov-path"
              data-slug={slug}
              style={{
                fill: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                fillOpacity: isActive ? 0.35 : 0.4,
                stroke: isActive ? 'var(--accent-primary)' : 'var(--border-strong, #c8c4bf)',
                strokeWidth: isActive ? 1.2 : 0.5,
                strokeLinejoin: 'round',
                cursor: 'pointer',
              }}
              onMouseEnter={() => onProvinceHover(slug)}
              onMouseLeave={() => onProvinceHover(null)}
              onClick={() => onProvinceClick(slug)}
            />
          )
        })}

        {/* Combined territory label */}
        <text
          x={280}
          y={450}
          textAnchor="middle"
          dominantBaseline="middle"
          className="prov-lbl"
          style={{
            fill: activeSlug === 'northern-territories' ? 'var(--accent-primary)' : 'var(--text-muted)',
            opacity: 0.6,
            fontSize: '12px',
          }}
        >
          NT
        </text>

        {/* Province paths (front layer) */}
        {provinces.map((loc) => {
          const slug = ID_TO_SLUG[loc.id]!
          const isActive = activeSlug === slug
          return (
            <path
              key={loc.id}
              d={loc.path}
              className="prov-path"
              data-slug={slug}
              style={{
                fill: isActive ? 'var(--accent-primary)' : 'var(--surface-primary)',
                fillOpacity: isActive ? 0.45 : 0.92,
                stroke: isActive ? 'var(--accent-primary)' : 'var(--border-strong, #c8c4bf)',
                strokeWidth: isActive ? 1.5 : 0.8,
                strokeLinejoin: 'round',
                cursor: 'pointer',
              }}
              onMouseEnter={() => onProvinceHover(slug)}
              onMouseLeave={() => onProvinceHover(null)}
              onClick={() => onProvinceClick(slug)}
            />
          )
        })}

        {/* Province labels */}
        {provinces.map((loc) => {
          const pos = LABEL_POS[loc.id]
          const abbr = ABBR_LABELS[loc.id]
          if (!pos || !abbr) return null
          const slug = ID_TO_SLUG[loc.id]!
          const isActive = activeSlug === slug
          const isSmall = ['pe', 'nb', 'ns'].includes(loc.id)
          return (
            <text
              key={`label-${loc.id}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="prov-lbl"
              style={{
                fill: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: isSmall ? '10px' : '14px',
                fontWeight: isActive ? 800 : 700,
              }}
            >
              {abbr}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
