interface ScopeLabelProps {
  provinceName: string
  isFallback: boolean
  /** e.g. "stories", "jobs", "research", "trends" */
  dataType?: string
}

export default function ScopeLabel({ provinceName, isFallback, dataType = 'stories' }: ScopeLabelProps) {
  if (!isFallback) {
    return (
      <span
        style={{
          fontSize: '12px',
          fontFamily: 'var(--font-ui)',
          color: 'var(--text-muted)',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        }}
      >
        {provinceName}
      </span>
    )
  }

  return (
    <div
      style={{
        fontSize: '12px',
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-muted)',
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: 'color-mix(in srgb, var(--text-muted) 6%, transparent)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <strong style={{ color: 'var(--text-secondary)' }}>Showing national AI coverage</strong>
      <br />
      No {provinceName}-specific {dataType} found in the last 30 days.
    </div>
  )
}
