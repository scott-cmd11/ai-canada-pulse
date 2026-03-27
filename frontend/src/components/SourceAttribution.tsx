import { getSourceById } from '@/lib/source-registry'

interface SourceAttributionProps {
  sourceId: string
  /** Time string from usePolling's lastUpdated (e.g. "2:34:05 PM") */
  lastUpdated?: string | null
}

export default function SourceAttribution({ sourceId, lastUpdated }: SourceAttributionProps) {
  const source = getSourceById(sourceId)
  if (!source) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '6px',
        padding: '12px 0 0',
        marginTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '11px',
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-muted)',
        letterSpacing: '0.02em',
        flexWrap: 'wrap',
      }}
    >
      <span>
        Data from{' '}
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          {source.name} →
        </a>
      </span>
      {lastUpdated && (
        <>
          <span style={{ color: 'var(--border-subtle)' }}>·</span>
          <span>Updated {lastUpdated}</span>
        </>
      )}
    </div>
  )
}
