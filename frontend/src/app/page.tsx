// frontend/src/app/page.tsx
import { Suspense } from 'react'
import { getDigest } from '@/lib/digest-client'
import { fetchAllStories } from '@/lib/rss-client'
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

async function fetchHeadlines() {
  try {
    const raw = await fetchAllStories()
    return raw.slice(0, 8).map((s) => ({
      headline: s.headline,
      sourceUrl: s.sourceUrl ?? '',
      sourceName: s.sourceName ?? '',
    }))
  } catch {
    return []
  }
}

function HeadlinesFallback({
  message,
  stories,
}: {
  message: string
  stories: { headline: string; sourceUrl: string; sourceName: string }[]
}) {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px' }}>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>{message}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {stories.map((s, i) => (
          <div key={`${s.sourceUrl}-${i}`}>
            {i > 0 && <div style={{ height: '1px', background: 'var(--border-subtle)' }} />}
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <span>{s.headline}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '12px', whiteSpace: 'nowrap' }}>{s.sourceName} -&gt;</span>
            </a>
          </div>
        ))}
      </div>
      <a href="/dashboard" style={{ display: 'block', marginTop: '20px', color: 'var(--accent-primary)', fontSize: '13px' }}>
        View the live dashboard -&gt;
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
    const stories = await fetchHeadlines()
    return (
      <>
        <FreshnessNotice tone="error" title="Digest temporarily unavailable">
          The cached digest store is unavailable. Showing live public-source headlines instead. <LatestHeadlinesLink />.
        </FreshnessNotice>
        <HeadlinesFallback message="Latest public-source headlines:" stories={stories} />
      </>
    )
  }

  if (digest && !digest.error && digest.date !== today) {
    const stories = await fetchHeadlines()
    return (
      <>
        <FreshnessNotice title="Digest freshness warning">
          The latest stored digest is dated {digest.date}, not today. Showing current headlines first and keeping the
          archived digest clearly labelled below. <LatestHeadlinesLink />.
        </FreshnessNotice>
        <HeadlinesFallback message="Current public-source headlines:" stories={stories.slice(0, 5)} />
        <DigestView digest={digest} isToday={false} />
      </>
    )
  }

  if (!digest || digest.error) {
    const previousDigest = await findLatestDigest(today)

    if (previousDigest) {
      const stories = await fetchHeadlines()
      return (
        <>
          <FreshnessNotice tone={digest?.error ? 'error' : 'warning'} title={digest?.error ? 'Digest generation issue' : "Today's digest is being prepared"}>
            Showing the latest available digest from {previousDigest.date}. The live dashboard and headline feed continue
            to update independently. <LatestHeadlinesLink />.
          </FreshnessNotice>
          <HeadlinesFallback message="Current public-source headlines:" stories={stories.slice(0, 5)} />
          <DigestView digest={previousDigest} isToday={false} />
        </>
      )
    }

    const stories = await fetchHeadlines()
    return (
      <HeadlinesFallback
        message={digest?.error ? "Today's digest is temporarily unavailable. Here are the latest headlines:" : `Today's digest is being prepared.${stories.length > 0 ? " In the meantime, here are today's latest headlines:" : ''}`}
        stories={stories}
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
