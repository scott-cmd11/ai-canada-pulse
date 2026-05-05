import { getDigest } from '@/lib/digest-client'
import { readDashboardEnrichmentBundle } from '@/lib/ai-enrichment-cache'
import { fetchAllStories } from '@/lib/rss-client'
import { SOURCES } from '@/lib/source-registry'
import { fetchStatCanAdoption, type AdoptionSourceHealth } from '@/lib/statcan-sdmx-client'
import { fetchGovAIRegistry } from '@/lib/gov-ai-registry-client'
import { fetchProcurementDemand } from '@/lib/procurement-demand-client'
import { getEditorialDate } from '@/lib/editorial-date'

function formatAge(iso?: string | null) {
  if (!iso) return 'Not available'
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return 'Not available'
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function StatusItem({ label, value, detail, tone = 'neutral' }: { label: string; value: string; detail: string; tone?: 'neutral' | 'warning' | 'good' }) {
  const color = tone === 'good' ? 'var(--status-positive)' : tone === 'warning' ? 'var(--status-gold)' : 'var(--text-secondary)'
  return (
    <div style={{ minWidth: 0 }}>
      <p
        style={{
          margin: 0,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono), monospace',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <p style={{ margin: '4px 0 0', color, fontSize: '13px', fontWeight: 700 }}>{value}</p>
      <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '11px' }}>{detail}</p>
    </div>
  )
}

function summarizeSourceHealth(health: AdoptionSourceHealth[]) {
  if (health.length === 0) {
    return { value: 'Unavailable', detail: 'No adoption source checks', tone: 'warning' as const }
  }

  const liveCount = health.filter((source) => source.status === 'live').length
  const problemSources = health.filter((source) => source.status !== 'live')
  return {
    value: liveCount === health.length ? 'Live' : `${liveCount}/${health.length} live`,
    detail: problemSources.length
      ? problemSources.map((source) => `${source.label}: ${source.status}`).join('; ')
      : 'Official adoption pipeline',
    tone: problemSources.length ? 'warning' as const : 'good' as const,
  }
}

export default async function OperationalStatus() {
  const today = getEditorialDate()
  const [stories, digest, enrichment, adoption, registry, procurement] = await Promise.all([
    fetchAllStories().catch(() => []),
    getDigest(today).catch(() => null),
    readDashboardEnrichmentBundle().catch(() => null),
    fetchStatCanAdoption().catch(() => null),
    fetchGovAIRegistry().catch(() => null),
    fetchProcurementDemand().catch(() => null),
  ])

  const latestStory = stories
    .map((story) => story.publishedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
  const digestFresh = digest && !digest.error && digest.date === today
  const enrichmentAge = enrichment?.canada?.generatedAt ?? enrichment?.generatedAt ?? null
  const adoptionSourceHealth = summarizeSourceHealth([
    ...(adoption?.sourceHealth ?? []),
    ...(registry?.sourceHealth ?? []),
    ...(procurement?.sourceHealth ?? []),
  ])

  return (
    <section
      aria-label="Automation freshness"
      style={{
        maxWidth: '1480px',
        margin: '0 auto',
        padding: '10px 16px 0',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-primary)',
          padding: '12px',
        }}
      >
        <StatusItem label="Public feed" value={`${stories.length} signals`} detail={formatAge(latestStory)} tone={stories.length > 0 ? 'good' : 'warning'} />
        <StatusItem label="Daily digest" value={digestFresh ? 'Current' : 'Behind'} detail={digest?.date ?? 'No digest found'} tone={digestFresh ? 'good' : 'warning'} />
        <StatusItem label="AI enrichment" value={enrichmentAge ? 'Cached' : 'Missing'} detail={formatAge(enrichmentAge)} tone={enrichmentAge ? 'good' : 'warning'} />
        <StatusItem label="Adoption sources" value={adoptionSourceHealth.value} detail={adoptionSourceHealth.detail} tone={adoptionSourceHealth.tone} />
        <StatusItem label="Tracked sources" value={`${SOURCES.length} sources`} detail="Registry-backed" tone="good" />
      </div>
    </section>
  )
}
