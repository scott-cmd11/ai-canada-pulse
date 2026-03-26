'use client'

interface CanadaMapProps {
  onProvinceHover: (slug: string | null) => void
  onProvinceClick: (slug: string) => void
  activeSlug: string | null
}

interface ProvinceShape {
  slug: string
  abbr: string
  labelX: number
  labelY: number
  // path or rect definition
  type: 'path' | 'rect'
  d?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

// Stylized map coordinates — viewBox 0 0 1000 700
// Layout: territories top, BC left coast, prairies centre, Ontario/QC right-centre, Atlantic far right
const PROVINCES: ProvinceShape[] = [
  // ── Northern Territories (Yukon + NWT + Nunavut) ── wide top band
  {
    slug: 'northern-territories',
    abbr: 'NT',
    labelX: 400,
    labelY: 62,
    type: 'path',
    d: 'M 30 20 L 700 20 L 700 140 L 560 140 L 560 110 L 420 110 L 420 140 L 30 140 Z',
  },

  // ── British Columbia ── tall left column
  {
    slug: 'british-columbia',
    abbr: 'BC',
    labelX: 85,
    labelY: 300,
    type: 'rect',
    x: 30,
    y: 150,
    width: 140,
    height: 260,
  },

  // ── Alberta ── tall column
  {
    slug: 'alberta',
    abbr: 'AB',
    labelX: 225,
    labelY: 300,
    type: 'rect',
    x: 178,
    y: 150,
    width: 110,
    height: 260,
  },

  // ── Saskatchewan ── tall column
  {
    slug: 'saskatchewan',
    abbr: 'SK',
    labelX: 353,
    labelY: 300,
    type: 'rect',
    x: 296,
    y: 150,
    width: 110,
    height: 260,
  },

  // ── Manitoba ── tall column
  {
    slug: 'manitoba',
    abbr: 'MB',
    labelX: 475,
    labelY: 300,
    type: 'rect',
    x: 414,
    y: 150,
    width: 110,
    height: 260,
  },

  // ── Ontario ── large, slightly taller
  {
    slug: 'ontario',
    abbr: 'ON',
    labelX: 610,
    labelY: 295,
    type: 'path',
    d: 'M 532 150 L 700 150 L 700 200 L 720 200 L 720 430 L 532 430 Z',
  },

  // ── Quebec ── large, distinctive shape
  {
    slug: 'quebec',
    abbr: 'QC',
    labelX: 785,
    labelY: 270,
    type: 'path',
    d: 'M 728 150 L 870 150 L 870 170 L 900 170 L 900 420 L 728 420 Z',
  },

  // ── New Brunswick ── small, bottom right of Quebec
  {
    slug: 'new-brunswick',
    abbr: 'NB',
    labelX: 900,
    labelY: 460,
    type: 'rect',
    x: 856,
    y: 428,
    width: 82,
    height: 72,
  },

  // ── Nova Scotia ── small peninsula below NB
  {
    slug: 'nova-scotia',
    abbr: 'NS',
    labelX: 920,
    labelY: 540,
    type: 'path',
    d: 'M 860 508 L 938 508 L 960 530 L 950 568 L 895 572 L 860 550 Z',
  },

  // ── Prince Edward Island ── tiny island above NS
  {
    slug: 'prince-edward-island',
    abbr: 'PE',
    labelX: 960,
    labelY: 480,
    type: 'path',
    d: 'M 944 462 L 980 462 L 982 478 L 948 480 Z',
  },

  // ── Newfoundland & Labrador ── island + labrador mass
  {
    slug: 'newfoundland-labrador',
    abbr: 'NL',
    labelX: 960,
    labelY: 210,
    type: 'path',
    d: 'M 908 158 L 990 158 L 990 310 L 960 330 L 940 310 L 960 290 L 960 200 L 908 200 Z',
  },
]

function getProvinceStyle(slug: string, activeSlug: string | null, hoveredSlug: string | null) {
  const isActive = activeSlug === slug
  const isHovered = hoveredSlug === slug

  if (isActive) {
    return {
      fill: 'var(--accent-primary)',
      fillOpacity: 0.5,
      stroke: 'var(--accent-primary)',
      strokeWidth: 1.5,
      cursor: 'pointer',
    }
  }
  if (isHovered) {
    return {
      fill: 'var(--accent-primary)',
      fillOpacity: 0.3,
      stroke: 'var(--accent-primary)',
      strokeWidth: 1.5,
      cursor: 'pointer',
    }
  }
  return {
    fill: 'var(--border-subtle)',
    fillOpacity: 0.6,
    stroke: 'var(--border-strong, var(--border-subtle))',
    strokeWidth: 1,
    cursor: 'pointer',
  }
}

export default function CanadaMap({ onProvinceHover, onProvinceClick, activeSlug }: CanadaMapProps) {
  // We track hovered internally for styling only; parent is notified via callback
  // Using a CSS-class approach so we avoid React state rerenders on every mouse move

  const handleMouseEnter = (slug: string) => {
    onProvinceHover(slug)
  }

  const handleMouseLeave = () => {
    onProvinceHover(null)
  }

  const handleClick = (slug: string) => {
    onProvinceClick(slug)
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox="0 0 1010 600"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        aria-label="Interactive map of Canada by province and territory"
        role="img"
      >
        <defs>
          <style>{`
            .province-shape {
              transition: fill 0.18s ease, fill-opacity 0.18s ease, stroke 0.18s ease;
            }
            .province-label {
              font-family: var(--font-ui, system-ui, sans-serif);
              font-size: 11px;
              font-weight: 700;
              fill: var(--text-primary);
              pointer-events: none;
              user-select: none;
              letter-spacing: 0.05em;
              opacity: 0.75;
            }
            .province-label-sm {
              font-size: 9px;
            }
          `}</style>
        </defs>

        {PROVINCES.map((province) => {
          const isActive = activeSlug === province.slug
          const baseStyle = {
            fill: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
            fillOpacity: isActive ? 0.5 : 0.6,
            stroke: isActive ? 'var(--accent-primary)' : 'var(--border-strong, #c8c4bf)',
            strokeWidth: isActive ? 1.5 : 1,
            cursor: 'pointer' as const,
            transition: 'fill 0.18s ease, fill-opacity 0.18s ease, stroke 0.18s ease',
          }

          const handlers = {
            onMouseEnter: () => handleMouseEnter(province.slug),
            onMouseLeave: () => handleMouseLeave(),
            onClick: () => handleClick(province.slug),
          }

          return (
            <g key={province.slug} role="button" aria-label={province.slug}>
              {province.type === 'rect' ? (
                <rect
                  x={province.x}
                  y={province.y}
                  width={province.width}
                  height={province.height}
                  style={baseStyle}
                  className="province-shape"
                  data-slug={province.slug}
                  {...handlers}
                />
              ) : (
                <path
                  d={province.d}
                  style={baseStyle}
                  className="province-shape"
                  data-slug={province.slug}
                  {...handlers}
                />
              )}

              {/* Hover overlay — separate transparent rect to capture mouse on thin shapes */}
              <text
                x={province.labelX}
                y={province.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`province-label${province.abbr === 'PE' || province.abbr === 'NL' ? ' province-label-sm' : ''}`}
                style={{
                  fill: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                  opacity: isActive ? 1 : 0.75,
                }}
              >
                {province.abbr}
              </text>
            </g>
          )
        })}

        {/* Atlantic legend note — PEI is tiny, add a leader line */}
        <line x1="975" y1="470" x2="960" y2="465" stroke="var(--border-subtle)" strokeWidth="0.8" />
      </svg>
    </div>
  )
}
