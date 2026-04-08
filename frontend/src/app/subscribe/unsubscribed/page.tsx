import Header from '@/components/Header'
import Link from 'next/link'

export const metadata = {
  title: 'Unsubscribed — AI Canada Pulse',
}

export default function UnsubscribedPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main className="mx-auto max-w-[520px] px-4 py-16 text-center sm:px-6">
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '12px',
          }}
        >
          Newsletter
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '16px',
          }}
        >
          You&apos;ve been unsubscribed
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '28px',
          }}
        >
          You won&apos;t receive any further emails from AI Canada Pulse. If you change your mind, you can always re-subscribe from the dashboard.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Back to Dashboard
        </Link>
      </main>
    </div>
  )
}
