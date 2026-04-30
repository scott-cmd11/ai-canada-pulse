import Header from '@/components/Header'
import PageHero from '@/components/PageHero'
import Link from 'next/link'

export const metadata = {
  title: 'Unsubscribed - AI Canada Pulse',
}

export default function UnsubscribedPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main className="page-main-narrow">
        <PageHero
          eyebrow="Newsletter"
          title={<>You are <span>unsubscribed</span></>}
          description="You will not receive any further emails from AI Canada Pulse. You can always re-subscribe from the dashboard."
          actions={
            <Link href="/dashboard" className="page-action">
              Back to dashboard
            </Link>
          }
          compact
        />
      </main>
    </div>
  )
}
