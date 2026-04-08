import Header from '@/components/Header'
import Link from 'next/link'

export const metadata = {
  title: 'Subscription Confirmed — AI Canada Pulse',
}

export default function ConfirmedPage() {
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
            color: 'var(--accent-primary)',
            marginBottom: '12px',
          }}
        >
          Subscription Confirmed
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
          You&apos;re subscribed
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '28px',
          }}
        >
          You&apos;ll receive a weekly summary of Canadian AI developments every Monday morning. You can unsubscribe anytime via the link in each email.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Explore the Dashboard
        </Link>
      </main>
    </div>
  )
}
