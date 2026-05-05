// frontend/src/app/page.tsx
import { Suspense } from 'react'
import { getDigest } from '@/lib/digest-client'
import DigestView from '@/components/DigestView'
import Header from '@/components/Header'
import FreshnessNotice, { LatestHeadlinesLink } from '@/components/FreshnessNotice'
import OperationalStatus from '@/components/OperationalStatus'
import type { DailyDigest } from '@/lib/digest-types'

function isoDateFromOffset(date: string, offsetDays: number) {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + offsetDays)
  return next.toISOString().split('T')[0]
}

async function findLatestDigest(today: string, maxDays = 7): Promise<DailyDigest | null> {
  for (let offset = -1; Math.abs(offset) <= maxDays; offset -= 1) {
    const date = isoDateFromOffset(today, offset)
    const digest = await getDigest(date).catch(() => null)
    if (digest && !digest.error) return digest
  }
  return null
}

export async function generateMetadata() {
  const today = new Date().toISOString().split('T')[0]
  const suffix = ' - AI Canada Pulse'
  try {
    const digest = await getDigest(today)
    const headline = digest && !digest.error && digest.date === today ? digest.headline : 'Today in Canadian AI'
    return {
      title: { absolute: `${headline}${suffix}` },
      description: digest && !digest.error && digest.date === today
        ? digest.intro?.slice(0, 155)
        : 'Daily AI digest tracking developments across Canada.',
      openGraph: { type: 'website' },
    }
  } catch {
    return {
      title: { absolute: `Today in Canadian AI${suffix}` },
      description: 'Daily AI digest tracking developments across Canada.',
      openGraph: { type: 'website' },
    }
  }
}

function DigestUnavailable({ message }: { message: string }) {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px' }}>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.6 }}>{message}</p>
      <a href="/dashboard" style={{ color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
        Open the live dashboard -&gt;
      </a>
    </div>
  )
}

async function DigestContent() {
  const today = new Date().toISOString().split('T')[0]
  let digest: DailyDigest | null = null
  let redisDown = false

  try {
    digest = await getDigest(today)
  } catch {
    redisDown = true
  }

  if (redisDown) {
    return (
      <>
        <FreshnessNotice tone="error" title="Digest temporarily unavailable">
          The cached digest store is unavailable. <LatestHeadlinesLink /> for the live source feed and adoption monitor.
        </FreshnessNotice>
        <DigestUnavailable message="The daily digest is temporarily unavailable. Live signals are still available on the dashboard." />
      </>
    )
  }

  if (digest && !digest.error && digest.date !== today) {
    return (
      <>
        <FreshnessNotice title="Digest freshness warning">
          The latest stored digest is dated {digest.date}, not today. The digest below is clearly labelled; live
          headlines stay on the dashboard. <LatestHeadlinesLink />.
        </FreshnessNotice>
        <DigestView digest={digest} isToday={false} />
      </>
    )
  }

  if (!digest || digest.error) {
    const previousDigest = await findLatestDigest(today)

    if (previousDigest) {
      return (
        <>
          <FreshnessNotice tone={digest?.error ? 'error' : 'warning'} title={digest?.error ? 'Digest generation issue' : "Today's digest is being prepared"}>
            Showing the latest available digest from {previousDigest.date}. Live headlines and source checks continue
            on the dashboard. <LatestHeadlinesLink />.
          </FreshnessNotice>
          <DigestView digest={previousDigest} isToday={false} />
        </>
      )
    }

    return (
      <DigestUnavailable
        message={digest?.error ? "Today's digest is temporarily unavailable." : "Today's digest is being prepared."}
      />
    )
  }

  return <DigestView digest={digest} isToday={true} />
}

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <OperationalStatus />
      <main style={{ paddingBottom: '60px' }}>
        <Suspense fallback={
          <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading today&apos;s digest...
          </div>
        }>
          <DigestContent />
        </Suspense>
      </main>
    </div>
  )
}
