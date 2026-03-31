interface StatItem {
  label: string
  value: string
  note?: string
  isPositive?: boolean
}

interface ProvinceStatsRibbonProps {
  stats: StatItem[]
}

export default function ProvinceStatsRibbon({ stats }: ProvinceStatsRibbonProps) {
  return (
    <div
      style={{
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '24px 0',
      }}
    >
      {/* Desktop: horizontal flex */}
      <div
        className="stats-ribbon-desktop"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              paddingLeft: i === 0 ? 0 : '24px',
              paddingRight: i === stats.length - 1 ? 0 : '24px',
              borderRight:
                i === stats.length - 1
                  ? 'none'
                  : '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
                marginTop: '4px',
                lineHeight: 1.1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: stat.isPositive ? 'var(--status-positive)' : 'var(--text-muted)',
                fontWeight: stat.isPositive ? 600 : 400,
                fontFamily: 'var(--font-ui)',
                marginTop: '4px',
              }}
            >
              {stat.note}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: 2-column grid */}
      <div
        className="stats-ribbon-mobile"
        style={{ display: 'none' }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '12px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
                marginTop: '4px',
                lineHeight: 1.1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: stat.isPositive ? 'var(--status-positive)' : 'var(--text-muted)',
                fontWeight: stat.isPositive ? 600 : 400,
                fontFamily: 'var(--font-ui)',
                marginTop: '4px',
              }}
            >
              {stat.note}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stats-ribbon-desktop {
            display: none !important;
          }
          .stats-ribbon-mobile {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  )
}
