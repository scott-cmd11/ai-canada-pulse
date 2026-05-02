// frontend/src/app/page.tsx
import { Suspense } from 'react'
import { getDigest } from '@/lib/digest-client'
import { fetchAllStories } from '@/lib/rss-client'
import DigestView from '@/components/DigestView'
import Header from '@/components/Header'

export async function generateMetadata() {
  const today = new Date().toISOString().split('T')[0]
  const suffix = ' — AI Canada Pulse'
  try {
    const digest = await getDigest(today)
    const headline = digest?.headline ?? 'Today in Canadian AI'
    return {
      title: { absolute: `${headline}${suffix}` },
      description: digest?.intro?.slice(0, 155) ?? 'Daily AI digest tracking developments across Canada.',
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
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '44px 20px' }}>
      <section className="saas-card" style={{ padding: '24px' }}>
        <p className="eyebrow" style={{ marginBottom: '10px' }}>Latest headlines</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.08, marginBottom: '12px' }}>
          Today in Canadian AI
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '22px' }}>{message}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {stories.map((s, i) => (
          <div key={i} style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', background: 'var(--surface-elevated)' }}>
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '12px 14px', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.45 }}
            >
              <span>{s.headline}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '12px', whiteSpace: 'nowrap' }}>{s.sourceName} →</span>
            </a>
          </div>
        ))}
      </div>
      <a href="/dashboard" style={{ display: 'inline-flex', marginTop: '22px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
        View the live dashboard →
      </a>
      </section>
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
      return <DigestView digest={previousDigest} isToday={false} />
    }

    const stories = await fetchHeadlines()
    return (
      <HeadlinesFallback
        message={`Today's digest is being prepared.${stories.length > 0 ? " In the meantime, here are today's latest headlines:" : ''}`}
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

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main style={{ paddingBottom: '60px' }}>
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
