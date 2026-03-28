interface ComingSoonSectionProps {
  title: string
  message?: string
}

export default function ComingSoonSection({ title, message }: ComingSoonSectionProps) {
  return (
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
          marginBottom: '16px',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          border: '1px dashed var(--border-subtle)',
          borderRadius: '12px',
          background: 'var(--surface-primary)',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          We&apos;re building this section
        </div>
        {message && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-ui)',
              marginTop: '4px',
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
