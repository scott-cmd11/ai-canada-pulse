import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import DashboardFooter from '@/components/DashboardFooter'
import { DATA_CENTRES, TYPE_LABELS, TYPE_COLOURS, type DataCentreType } from '@/lib/datacentres-data'

export const metadata: Metadata = {
  title: 'Data Centres in Canada',
  description: 'Interactive map of cloud regions, colocation facilities, and telecom data centres across Canada.',
}

// Leaflet accesses window on load — must disable SSR
const DataCentreMapClient = dynamic(
  () => import('@/components/DataCentreMapClient'),
  { ssr: false, loading: () => (
    <div
      className="flex items-center justify-center rounded-xl border"
      style={{ height: '560px', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}
    >
      Loading map…
    </div>
  )}
)

const ALL_TYPES = ['hyperscaler', 'colo', 'telco', 'hpc', 'government'] as DataCentreType[]

export default function DataCentresPage() {
  const countByType = ALL_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = DATA_CENTRES.filter(dc => dc.type === t).length
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <Header />
      <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-primary)' }}>
            Infrastructure
          </p>
          <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Canadian Data Centres
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {DATA_CENTRES.length} facilities mapped — cloud regions, colocation providers, and telecom infrastructure.
            Click any marker for details.
          </p>
        </div>

        {/* Summary stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ALL_TYPES.filter(type => countByType[type] > 0).map(type => (
            <div
              key={type}
              className="rounded-xl border px-4 py-3"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-primary)' }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: TYPE_COLOURS[type] }}
              >
                {TYPE_LABELS[type]}
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {countByType[type]}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>facilities</div>
            </div>
          ))}
        </div>

        {/* Map */}
        <DataCentreMapClient />

      </main>
      <DashboardFooter />
    </div>
  )
}
