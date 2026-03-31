// frontend/src/components/SectionSummary.tsx
export default function SectionSummary({ summary }: { summary: string | null | undefined }) {
  if (!summary) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '10px 14px',
        borderRadius: '8px',
        background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent)',
        marginBottom: '16px',
      }}
    >
      <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>✦</span>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-ui)',
          lineHeight: 1.5,
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        {summary}
      </p>
    </div>
  )
}
