// frontend/src/app/page.tsx
import { Suspense } from 'react'
import { getDigest } from '@/lib/digest-client'
import { fetchAllStories } from '@/lib/rss-client'
import DigestView from '@/components/DigestView'
import Header from '@/components/Header'

export async function generateMetadata() {
  const today = new Date().toISOString().split('T')[0]
  try {
    const digest = await getDigest(today)
    return {
      title: digest?.headline ?? 'Today in Canadian AI — AI Canada Pulse',
      description: digest?.intro?.slice(0, 155) ?? 'Daily AI digest tracking developments across Canada.',
      openGraph: { type: 'website' },
    }
  } catch {
    return {
      title: 'Today in Canadian AI — AI Canada Pulse',
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
          <div key={i}>
            {i > 0 && <div style={{ height: '1px', background: 'var(--border-subtle)' }} />}
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <span>{s.headline}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '12px', whiteSpace: 'nowrap' }}>{s.sourceName} →</span>
            </a>
          </div>
        ))}
      </div>
      <a href="/dashboard" style={{ display: 'block', marginTop: '20px', color: 'var(--accent-primary)', fontSize: '13px' }}>
        View the live dashboard →
      </a>
    </div>
  )
}

async function DigestContent() {
  const today = new Date().toISOString().split('T')[0]

  // Three distinct states: pending (key missing), error sentinel (cron failed),
  // ready (normal render). A Redis outage (thrown error) triggers a headlines-only fallback.
  let digest = null
  let redisDown = false

  try {
    digest = await getDigest(today)
  } catch {
    redisDown = true
  }

  // Fallback: Redis is unavailable — show latest headlines
  if (redisDown) {
    const stories = await fetchHeadlines()
    return (
      <HeadlinesFallback
        message="The digest is temporarily unavailable. Here are today's latest headlines:"
        stories={stories}
      />
    )
  }

  // Pending: cron hasn't run yet today — show headlines so the page isn't empty
  if (!digest) {
    const stories = await fetchHeadlines()
    return (
      <HeadlinesFallback
        message={`Today's digest is being prepared (publishes after 12:00 UTC).${stories.length > 0 ? " In the meantime, here are today's latest headlines:" : ''}`}
        stories={stories}
      />
    )
  }

  // Error sentinel: cron ran but generation failed
  if (digest.error) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Today&apos;s digest is temporarily unavailable.
        </p>
        <a href="/dashboard" style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>
          View the live dashboard →
        </a>
      </div>
    )
  }

  return <DigestView digest={digest} isToday={true} />
}

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main style={{ paddingBottom: '60px' }}>
        <Suspense fallback={
          <div style={{ maxWidth: '680px', margin: '60px auto', padding: '0 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading today&apos;s digest…
          </div>
        }>
          <DigestContent />
        </Suspense>
      </main>
    </div>
  )
}
