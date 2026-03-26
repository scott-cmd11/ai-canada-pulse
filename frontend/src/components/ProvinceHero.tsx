'use client'

import type { ProvinceConfig } from '@/lib/provinces-config'

interface HeroStat {
  value: string
  unit: string
  change: string
}

interface ProvinceHeroProps {
  province: ProvinceConfig
  heroStat: HeroStat
}

export default function ProvinceHero({ province, heroStat }: ProvinceHeroProps) {
  const isPositiveChange =
    heroStat.change.startsWith('↑') || heroStat.change.startsWith('+')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '48px',
        padding: '56px 0 40px',
      }}
      className="province-hero"
    >
      {/* Left column */}
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <p
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          Province Profile
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-1.5px',
            color: 'var(--ink)',
            lineHeight: 1.05,
            marginBottom: '20px',
          }}
        >
          {province.name}
        </h1>
        <p
          style={{
            fontSize: '17px',
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
            maxWidth: '540px',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {province.description}
        </p>
      </div>

      {/* Right column */}
      <div
        style={{
          textAlign: 'right',
          flexShrink: 0,
        }}
        className="province-hero-stat"
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '80px',
            fontWeight: 700,
            letterSpacing: '-3px',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {heroStat.value}
        </div>
        <div
          style={{
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            marginTop: '8px',
          }}
        >
          {heroStat.unit}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: isPositiveChange
              ? 'var(--status-positive)'
              : 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            marginTop: '6px',
          }}
        >
          {heroStat.change}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .province-hero {
            flex-direction: column !important;
            gap: 32px !important;
          }
          .province-hero-stat {
            text-align: left !important;
          }
        }
      `}</style>
    </div>
  )
}
