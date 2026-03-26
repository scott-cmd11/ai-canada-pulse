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
  d: string
}

// Simplified but recognizable Canada province boundaries
// Derived from public-domain Natural Earth data, simplified for web SVG
// viewBox: 0 0 800 600
const PROVINCES: ProvinceShape[] = [
  // British Columbia — west coast with coastal indentation
  {
    slug: 'british-columbia',
    abbr: 'BC',
    labelX: 88,
    labelY: 340,
    d: 'M50,200 L55,185 L70,175 L80,160 L100,155 L115,150 L120,145 L115,135 L125,120 L140,115 L145,120 L148,150 L148,420 L130,425 L120,410 L105,415 L95,400 L80,405 L65,395 L55,380 L45,360 L40,340 L35,310 L40,280 L45,260 L42,240 L48,220 Z',
  },
  // Alberta — rectangular prairie province
  {
    slug: 'alberta',
    abbr: 'AB',
    labelX: 185,
    labelY: 300,
    d: 'M148,150 L148,120 L222,120 L222,420 L148,420 Z',
  },
  // Saskatchewan — rectangular prairie province
  {
    slug: 'saskatchewan',
    abbr: 'SK',
    labelX: 260,
    labelY: 300,
    d: 'M222,120 L300,120 L300,420 L222,420 Z',
  },
  // Manitoba — with Hudson Bay indent on northeast
  {
    slug: 'manitoba',
    abbr: 'MB',
    labelX: 345,
    labelY: 320,
    d: 'M300,120 L370,120 L380,115 L390,120 L395,140 L385,160 L380,180 L390,200 L395,220 L390,240 L385,250 L390,420 L300,420 Z',
  },
  // Ontario — large province, Great Lakes southern border
  {
    slug: 'ontario',
    abbr: 'ON',
    labelX: 455,
    labelY: 350,
    d: 'M390,200 L395,180 L400,160 L395,140 L390,120 L395,115 L405,105 L420,95 L440,90 L460,88 L480,92 L495,100 L505,115 L510,130 L510,150 L505,170 L500,190 L505,210 L520,220 L530,240 L535,260 L530,280 L520,300 L525,320 L530,340 L525,360 L520,380 L510,400 L500,420 L490,435 L475,445 L460,450 L445,448 L430,440 L418,430 L410,420 L405,435 L395,445 L385,440 L380,425 L390,420 L385,250 L390,240 L395,220 Z',
  },
  // Quebec — largest province, extends north to Ungava Bay
  {
    slug: 'quebec',
    abbr: 'QC',
    labelX: 580,
    labelY: 280,
    d: 'M510,130 L520,115 L535,100 L550,85 L570,75 L590,68 L610,60 L630,55 L650,58 L665,65 L675,78 L680,95 L678,115 L670,135 L660,155 L655,175 L650,195 L648,220 L650,240 L655,260 L658,280 L655,300 L648,320 L640,340 L630,360 L620,375 L605,390 L590,400 L575,408 L560,412 L548,410 L540,400 L535,385 L530,370 L525,360 L530,340 L525,320 L530,280 L535,260 L530,240 L520,220 L505,210 L500,190 L505,170 L510,150 Z',
  },
  // New Brunswick
  {
    slug: 'new-brunswick',
    abbr: 'NB',
    labelX: 628,
    labelY: 428,
    d: 'M605,390 L620,392 L635,400 L648,410 L650,425 L645,440 L635,448 L620,450 L608,445 L600,435 L598,420 L600,405 Z',
  },
  // Nova Scotia — peninsula extending southeast
  {
    slug: 'nova-scotia',
    abbr: 'NS',
    labelX: 668,
    labelY: 468,
    d: 'M635,448 L645,450 L658,448 L672,452 L688,458 L698,465 L705,475 L700,485 L690,490 L678,488 L665,485 L652,480 L642,472 L635,462 L632,455 Z',
  },
  // Prince Edward Island — small island
  {
    slug: 'prince-edward-island',
    abbr: 'PE',
    labelX: 680,
    labelY: 435,
    d: 'M660,430 L672,427 L685,430 L692,436 L688,442 L675,444 L662,440 Z',
  },
  // Newfoundland & Labrador — island + mainland Labrador
  {
    slug: 'newfoundland-labrador',
    abbr: 'NL',
    labelX: 710,
    labelY: 300,
    d: 'M665,65 L680,60 L700,58 L720,65 L730,80 L725,100 L718,120 L715,145 L720,170 L725,195 L720,220 L710,240 L700,250 L695,260 L698,280 L710,290 L725,300 L735,315 L738,335 L730,350 L715,358 L700,355 L688,345 L680,330 L678,310 L682,295 L680,280 L670,265 L658,280 L655,260 L650,240 L648,220 L650,195 L655,175 L660,155 L670,135 L678,115 L680,95 L675,78 Z',
  },
  // Northern Territories (Yukon + NWT + Nunavut combined)
  {
    slug: 'northern-territories',
    abbr: 'NT',
    labelX: 340,
    labelY: 65,
    d: 'M50,200 L55,185 L70,175 L80,160 L100,155 L115,150 L120,145 L115,135 L125,120 L140,115 L145,120 L148,120 L222,120 L300,120 L370,120 L380,115 L390,120 L395,115 L405,105 L420,95 L440,90 L460,88 L480,92 L495,100 L505,115 L510,130 L510,150 L505,170 L500,190 L505,210 L520,220 L530,240 L535,260 L535,100 L550,85 L570,75 L590,68 L610,60 L630,55 L650,58 L665,65 L680,60 L700,58 L720,65 L730,80 L740,60 L750,40 L740,25 L720,15 L690,10 L650,8 L600,12 L550,18 L500,15 L450,10 L400,8 L350,12 L300,18 L250,15 L200,12 L150,18 L100,25 L70,40 L55,60 L45,80 L38,100 L35,130 L38,160 L42,180 Z',
  },
]

export default function CanadaMap({ onProvinceHover, onProvinceClick, activeSlug }: CanadaMapProps) {
  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox="0 0 800 510"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        aria-label="Interactive map of Canada by province and territory"
        role="img"
      >
        <defs>
          <style>{`
            .province-shape {
              transition: fill 0.2s ease, fill-opacity 0.2s ease, stroke 0.2s ease;
            }
            .province-shape:hover {
              fill: var(--accent-primary) !important;
              fill-opacity: 0.35 !important;
              stroke: var(--accent-primary) !important;
              stroke-width: 1.5 !important;
            }
            .province-label {
              font-family: var(--font-ui, system-ui, sans-serif);
              font-size: 12px;
              font-weight: 700;
              fill: var(--text-muted);
              pointer-events: none;
              user-select: none;
              letter-spacing: 0.08em;
            }
            .province-label-sm {
              font-size: 9px;
            }
          `}</style>
        </defs>

        {/* Render territories first (back layer) */}
        {PROVINCES.filter(p => p.slug === 'northern-territories').map((province) => (
          <g key={province.slug} role="button" aria-label={province.slug}>
            <path
              d={province.d}
              className="province-shape"
              data-slug={province.slug}
              style={{
                fill: activeSlug === province.slug ? 'var(--accent-primary)' : 'var(--border-subtle)',
                fillOpacity: activeSlug === province.slug ? 0.4 : 0.35,
                stroke: activeSlug === province.slug ? 'var(--accent-primary)' : 'var(--border-strong, #c8c4bf)',
                strokeWidth: activeSlug === province.slug ? 1.5 : 0.8,
                cursor: 'pointer',
              }}
              onMouseEnter={() => onProvinceHover(province.slug)}
              onMouseLeave={() => onProvinceHover(null)}
              onClick={() => onProvinceClick(province.slug)}
            />
            <text x={province.labelX} y={province.labelY} textAnchor="middle" dominantBaseline="middle" className="province-label" style={{ opacity: 0.5 }}>
              {province.abbr}
            </text>
          </g>
        ))}

        {/* Render provinces on top */}
        {PROVINCES.filter(p => p.slug !== 'northern-territories').map((province) => {
          const isActive = activeSlug === province.slug
          const isSmall = ['PE', 'NB', 'NS'].includes(province.abbr)

          return (
            <g key={province.slug} role="button" aria-label={province.slug}>
              <path
                d={province.d}
                className="province-shape"
                data-slug={province.slug}
                style={{
                  fill: isActive ? 'var(--accent-primary)' : 'var(--surface-primary)',
                  fillOpacity: isActive ? 0.5 : 0.9,
                  stroke: isActive ? 'var(--accent-primary)' : 'var(--border-strong, #c8c4bf)',
                  strokeWidth: isActive ? 1.8 : 1,
                  strokeLinejoin: 'round' as const,
                  cursor: 'pointer',
                }}
                onMouseEnter={() => onProvinceHover(province.slug)}
                onMouseLeave={() => onProvinceHover(null)}
                onClick={() => onProvinceClick(province.slug)}
              />
              <text
                x={province.labelX}
                y={province.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`province-label${isSmall ? ' province-label-sm' : ''}`}
                style={{
                  fill: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 800 : 700,
                }}
              >
                {province.abbr}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
