import Link from 'next/link'
import { PROVINCES, REGION_ORDER, REGION_LABELS, type ProvinceConfig, type ProvinceRegion } from '@/lib/provinces-config'

// Group provinces by region in the defined display order
const byRegion: Record<ProvinceRegion, ProvinceConfig[]> = {
  Atlantic: [], Central: [], Prairies: [], Pacific: [], North: [],
}
for (const p of PROVINCES) byRegion[p.region].push(p)

function ProvinceCard({ province }: { province: ProvinceConfig }) {
  const topInstitutions = province.institutions.slice(0, 2)
  const popDisplay = province.population >= 1
    ? `${province.population.toFixed(1)}M`
    : `${Math.round(province.population * 1000)}K`

  return (
    <Link
      href={`/provinces/${province.slug}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 22px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-primary)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        cursor: 'pointer',
        minHeight: '180px',
      }}
      className="province-card"
    >
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '17px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
          }}>
            {province.name}
          </span>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            background: 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}>
            {province.abbreviation}
          </span>
        </div>
        <span className="province-card-arrow" style={{
          fontSize: '14px',
          color: 'var(--accent-primary)',
          opacity: 0,
          transform: 'translateX(-4px)',
          transition: 'opacity 0.2s, transform 0.2s',
          flexShrink: 0,
        }}>→</span>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
          🏛 {province.capital}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
          👥 {popDisplay}
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
        fontFamily: 'var(--font-ui)',
        flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        marginBottom: topInstitutions.length > 0 ? '12px' : 0,
      }}>
        {province.description}
      </p>

      {/* Institutions */}
      {topInstitutions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {topInstitutions.map((inst) => (
            <span key={inst.name} style={{
              fontSize: '10px',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
              padding: '2px 7px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}>
              {inst.name}
            </span>
          ))}
          {province.institutions.length > 2 && (
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-ui)',
              color: 'var(--text-muted)',
              padding: '2px 4px',
            }}>
              +{province.institutions.length - 2} more
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

export default function ProvinceIndex() {
  return (
    <div>
      {REGION_ORDER.map((region) => {
        const provinces = byRegion[region]
        if (provinces.length === 0) return null
        return (
          <div key={region} style={{ marginBottom: '40px' }}>
            {/* Region heading */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--text-muted)',
                margin: 0,
              }}>
                {REGION_LABELS[region]}
              </h2>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-muted)',
                opacity: 0.6,
              }}>
                {provinces.length} {provinces.length === 1 ? 'region' : 'regions'}
              </span>
            </div>

            {/* Card grid */}
            <div className="province-grid">
              {provinces.map((province) => (
                <ProvinceCard key={province.slug} province={province} />
              ))}
            </div>
          </div>
        )
      })}

      <style>{`
        .province-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .province-card:hover {
          border-color: var(--accent-primary);
          box-shadow: 0 4px 20px color-mix(in srgb, var(--accent-primary) 10%, transparent);
          transform: translateY(-2px);
        }
        .province-card:hover .province-card-arrow {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }
        @media (max-width: 900px) {
          .province-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .province-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
