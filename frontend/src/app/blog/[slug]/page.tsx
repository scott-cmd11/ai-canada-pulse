// frontend/src/app/blog/[slug]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDeepDive } from '@/lib/deep-dive-client'
import DeepDiveView from '@/components/DeepDiveView'
import Header from '@/components/Header'

// Dynamic — slugs are generated at runtime by the cron, not known at build time
export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  try {
    const post = await getDeepDive(params.slug)
    if (!post) return { title: 'Deep Dive — AI Canada Pulse' }
    return {
      title: `${post.title} — AI Canada Pulse`,
      description: post.body.split('\n\n')[0]?.slice(0, 155),
      openGraph: { type: 'article' },
    }
  } catch {
    return { title: 'Deep Dive — AI Canada Pulse' }
  }
}

async function PostContent({ slug }: { slug: string }) {
  const post = await getDeepDive(slug)
  if (!post) notFound()
  return <DeepDiveView post={post} />
}

export default function DeepDivePage({ params }: Props) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main style={{ paddingBottom: '60px' }}>
        <Suspense fallback={
          <div style={{ maxWidth: '680px', margin: '60px auto', padding: '0 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading…
          </div>
        }>
          <PostContent slug={params.slug} />
        </Suspense>
      </main>
    </div>
  )
}
