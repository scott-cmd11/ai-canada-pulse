// frontend/src/app/digest/[date]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDigest } from '@/lib/digest-client'
import DigestView from '@/components/DigestView'
import Header from '@/components/Header'

interface Props {
  params: { date: string }
}

export async function generateMetadata({ params }: Props) {
  try {
    const digest = await getDigest(params.date)
    return {
      title: digest?.headline ?? `Canadian AI — ${params.date}`,
      description: digest?.intro?.slice(0, 155) ?? `AI Canada Pulse digest for ${params.date}`,
      openGraph: { type: 'article' },
    }
  } catch {
    return {
      title: `Canadian AI — ${params.date}`,
      description: `AI Canada Pulse digest for ${params.date}`,
      openGraph: { type: 'article' },
    }
  }
}

async function ArchiveContent({ date }: { date: string }) {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()

  let digest = null
  try {
    digest = await getDigest(date)
  } catch {
    notFound()
  }
  if (!digest || digest.error) notFound()

  return <DigestView digest={digest} isToday={false} />
}

export default function ArchivePage({ params }: Props) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main style={{ paddingBottom: '60px' }}>
        <Suspense fallback={
          <div style={{ maxWidth: '680px', margin: '60px auto', padding: '0 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading digest…
          </div>
        }>
          <ArchiveContent date={params.date} />
        </Suspense>
      </main>
    </div>
  )
}
