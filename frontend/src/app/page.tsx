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

  // Pending: cron hasn't run yet today — try yesterday's digest before falling back to headlines
  if (!digest) {
    const yesterday = new Date(Date.UTC(
      parseInt(today.slice(0, 4)),
      parseInt(today.slice(5, 7)) - 1,
      parseInt(today.slice(8, 10)) - 1,
    )).toISOString().split('T')[0]

    let previousDigest = null
    try {
      previousDigest = await getDigest(yesterday)
    } catch {
      // ignore — fall through to headlines
    }

    if (previousDigest && !previousDigest.error) {
      return (
        <>
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Today&apos;s digest is being prepared — publishes after 12:00 UTC.
            </p>
          </div>
          <DigestView digest={previousDigest} isToday={false} />
        </>
      )
    }

    const stories = await fetchHeadlines()
    return (
      <HeadlinesFallback
        message={`Today's digest is being prepared (publishes after 12:00 UTC).${stories.length > 0 ? " In the meantime, here are today's latest headlines:" : ''}`}
        stories={stories}
      />
    )
  }

  // Error sentinel: cron ran but generation failed — try yesterday before falling back to headlines
  if (digest.error) {
    const yesterday = new Date(Date.UTC(
      parseInt(today.slice(0, 4)),
      parseInt(today.slice(5, 7)) - 1,
      parseInt(today.slice(8, 10)) - 1,
    )).toISOString().split('T')[0]

    let previousDigest = null
    try {
      previousDigest = await getDigest(yesterday)
    } catch {
      // ignore — fall through to headlines
    }

    if (previousDigest && !previousDigest.error) {
      return (
        <>
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Today&apos;s digest generation encountered an issue. Showing yesterday&apos;s edition.
            </p>
          </div>
          <DigestView digest={previousDigest} isToday={false} />
        </>
      )
    }

    const stories = await fetchHeadlines()
    return (
      <HeadlinesFallback
        message="Today's digest is temporarily unavailable. Here are the latest headlines:"
        stories={stories}
      />
    )
  }

  return <DigestView digest={digest} isToday={true} />
}

function SiteAbout() {
  return (
    <div
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: '28px 20px 20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '6px',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
        }}
      >
        AI Canada Pulse
      </h1>
      <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '10px' }}>
        Independent Canadian AI monitoring — news, research, legislation, jobs, and market signals from public sources.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--accent-secondary, #b45309)',
            background: 'color-mix(in srgb, var(--accent-secondary, #b45309) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-secondary, #b45309) 25%, transparent)',
            borderRadius: '999px',
            padding: '2px 8px',
          }}
        >
          Early access · more data coming
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          No gov. affiliation · may contain errors ·{' '}
          <a href="/methodology" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            how this works →
          </a>
        </span>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main style={{ paddingBottom: '60px' }}>
        <SiteAbout />
        <Suspense fallback={
          <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading today&apos;s digest…
          </div>
        }>
          <DigestContent />
        </Suspense>
      </main>
    </div>
  )
}
