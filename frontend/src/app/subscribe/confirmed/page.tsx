import Header from '@/components/Header'
import PageHero from '@/components/PageHero'
import Link from 'next/link'

export const metadata = {
  title: 'Subscription Confirmed - AI Canada Pulse',
}

export default function ConfirmedPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main className="page-main-narrow">
        <PageHero
          eyebrow="Subscription Confirmed"
          title={<>You are <span>subscribed</span></>}
          description="You will receive a weekly summary of Canadian AI developments every Monday morning. You can unsubscribe anytime via the link in each email."
          actions={
            <Link href="/dashboard" className="page-action" data-primary="true">
              Explore the dashboard
            </Link>
          }
          compact
        />
      </main>
    </div>
  )
}
