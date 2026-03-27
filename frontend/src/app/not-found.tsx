import Link from "next/link"

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-ui)',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '64px',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: 'var(--accent-primary)',
          lineHeight: 1,
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          marginTop: '16px',
          color: 'var(--text-primary)',
        }}
      >
        Page not found
      </h1>
      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          marginTop: '8px',
          maxWidth: '420px',
          lineHeight: 1.6,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        style={{
          marginTop: '24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 20px',
          borderRadius: '9999px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#fff',
          background: 'var(--accent-primary)',
          textDecoration: 'none',
        }}
      >
        Back to dashboard
      </Link>
    </div>
  )
}
