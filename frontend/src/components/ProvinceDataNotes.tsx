import type { ProvinceConfig } from '@/lib/provinces-config'

interface SectionMeta {
  key: keyof ProvinceConfig['sections']
  label: string
  source: string
  freshness: string
}

const SECTION_META: SectionMeta[] = [
  { key: 'stories',    label: 'News stories',       source: 'Google News RSS',            freshness: 'Cached 1 hour, refreshes every 2 min' },
  { key: 'trends',     label: 'Search trends',       source: 'Google Trends',              freshness: 'Cached 6 hours' },
  { key: 'jobs',       label: 'Job market',          source: 'Job posting aggregators',    freshness: 'Cached 6 hours' },
  { key: 'stocks',     label: 'Stocks',              source: 'Market data feeds',          freshness: 'Cached 30 min' },
  { key: 'research',   label: 'Research papers',     source: 'arXiv API',                  freshness: 'Cached 6 hours' },
  { key: 'parliament', label: 'Parliament activity', source: 'OpenParliament.ca',          freshness: 'Cached 6 hours' },
  { key: 'talent',     label: 'Talent & education',  source: 'IRCC / Statistics Canada',   freshness: 'Cached 24 hours' },
  { key: 'startups',   label: 'Ecosystem',           source: 'Startup & events registries',freshness: 'Cached 6–12 hours' },
]

export default function ProvinceDataNotes({ province }: { province: ProvinceConfig }) {
  const active = SECTION_META.filter((s) => province.sections[s.key])
  const inactive = SECTION_META.filter((s) => !province.sections[s.key])
  const isSmaller = inactive.length > active.length

  return (
    <details
      style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 0',
      }}
    >
      <summary style={{
        cursor: 'pointer',
        fontSize: '11px',
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        userSelect: 'none',
      }}>
        <span style={{ fontSize: '13px' }}>ⓘ</span>
        About the data on this page
      </summary>

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Active sources */}
        {active.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Active data sources
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-ui)' }}>
              <thead>
                <tr>
                  {(['Section', 'Source', 'Freshness'] as const).map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '4px 12px 8px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map((s) => (
                  <tr key={s.key}>
                    <td style={{ padding: '7px 12px 7px 0', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', borderBottom: '1px solid color-mix(in srgb, var(--border-subtle) 50%, transparent)' }}>{s.label}</td>
                    <td style={{ padding: '7px 12px 7px 0', color: 'var(--text-secondary)', borderBottom: '1px solid color-mix(in srgb, var(--border-subtle) 50%, transparent)' }}>{s.source}</td>
                    <td style={{ padding: '7px 0 7px 0', color: 'var(--text-muted)', whiteSpace: 'nowrap', borderBottom: '1px solid color-mix(in srgb, var(--border-subtle) 50%, transparent)' }}>{s.freshness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Unavailable sections + explanation */}
        {inactive.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Not available for {province.name}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'var(--font-ui)', marginBottom: '10px' }}>
              {isSmaller
                ? `The data sources for jobs, stocks, research, and parliament activity don't yet provide granular enough coverage for ${province.name}. These sections are available for Ontario, Québec, British Columbia, and Alberta where national data sources have sufficient regional resolution.`
                : `Some data sources are not yet configured for ${province.name}.`}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {inactive.map((s) => (
                <span key={s.key} style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-ui)',
                  color: 'var(--text-muted)',
                  background: 'color-mix(in srgb, var(--border-subtle) 60%, transparent)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* General note */}
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, fontFamily: 'var(--font-ui)', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          All sections load client-side after the page renders and poll for fresh data every 2 minutes. Sections show a loading state briefly on first visit. Data is cached on Vercel&apos;s edge network — actual external API calls happen much less frequently than the polling interval.
        </p>
      </div>
    </details>
  )
}
