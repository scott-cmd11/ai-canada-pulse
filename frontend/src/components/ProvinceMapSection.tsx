'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CanadaMap from '@/components/CanadaMap'
import ProvincePreviewPanel from '@/components/ProvincePreviewPanel'
import { PROVINCES } from '@/lib/provinces-config'

export default function ProvinceMapSection() {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const router = useRouter()

  const handleProvinceClick = (slug: string) => {
    router.push(`/provinces/${slug}`)
  }

  return (
    <section
      style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      {/* Heading */}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
          marginBottom: '8px',
        }}
      >
        Explore by Province
      </h2>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-ui)',
          marginBottom: '32px',
        }}
      >
        Click a province to see its full AI profile
      </p>

      {/* Desktop layout: map + preview panel side by side */}
      <div className="province-map-layout">
        <div style={{ flex: 1, minWidth: 0 }}>
          <CanadaMap
            onProvinceHover={setHoveredSlug}
            onProvinceClick={handleProvinceClick}
            activeSlug={hoveredSlug}
          />
        </div>

        <div className="province-panel-desktop">
          <ProvincePreviewPanel slug={hoveredSlug} />
        </div>
      </div>

      {/* Mobile: dropdown select instead of preview panel */}
      <div className="province-select-mobile">
        <label
          htmlFor="province-select"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            marginBottom: '8px',
          }}
        >
          Go to province
        </label>
        <select
          id="province-select"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              router.push(`/provinces/${e.target.value}`)
            }
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            fontFamily: 'var(--font-ui)',
            color: 'var(--text-primary)',
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            cursor: 'pointer',
            appearance: 'auto',
          }}
        >
          <option value="" disabled>
            Select a province…
          </option>
          {PROVINCES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <style>{`
        .province-map-layout {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 32px;
        }
        .province-panel-desktop {
          display: block;
        }
        .province-select-mobile {
          display: none;
        }
        @media (max-width: 768px) {
          .province-map-layout {
            flex-direction: column;
          }
          .province-panel-desktop {
            display: none;
          }
          .province-select-mobile {
            display: block;
            margin-top: 24px;
          }
        }
      `}</style>
    </section>
  )
}
