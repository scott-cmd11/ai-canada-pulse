import { NextResponse } from 'next/server'
import { getDigest } from '@/lib/digest-client'
import { readDashboardEnrichmentBundle } from '@/lib/ai-enrichment-cache'
import { fetchAllStories } from '@/lib/rss-client'
import { SOURCES } from '@/lib/source-registry'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const [stories, digest, enrichment] = await Promise.all([
    fetchAllStories().catch(() => []),
    getDigest(today).catch(() => null),
    readDashboardEnrichmentBundle().catch(() => null),
  ])

  const latestStoryPublishedAt = stories
    .map((story) => story.publishedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    stories: {
      count: stories.length,
      latestPublishedAt: latestStoryPublishedAt,
    },
    digest: {
      expectedDate: today,
      date: digest?.date ?? null,
      isCurrent: !!digest && !digest.error && digest.date === today,
      generatedAt: digest?.generatedAt ?? null,
      error: digest?.error === true,
      errorStage: digest?.errorStage ?? null,
    },
    enrichment: {
      generatedAt: enrichment?.canada?.generatedAt ?? enrichment?.generatedAt ?? null,
      summaryCount: enrichment?.canada ? Object.keys(enrichment.canada.summaries ?? {}).length : 0,
      topicCount: enrichment?.canada ? Object.keys(enrichment.canada.topics ?? {}).length : 0,
      briefCount: enrichment?.canada?.executiveBrief?.length ?? 0,
    },
    sources: {
      count: SOURCES.length,
      ids: SOURCES.map((source) => source.id),
    },
  })
}
