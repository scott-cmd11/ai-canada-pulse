import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import DashboardFooter from '@/components/DashboardFooter'
import PageHero from '@/components/PageHero'
import { DATA_CENTRES, TYPE_LABELS, TYPE_COLOURS, type DataCentreType } from '@/lib/datacentres-data'

export const metadata: Metadata = {
  title: 'Data Centres in Canada',
  description: 'Interactive map of cloud regions, colocation facilities, and telecom data centres across Canada.',
}

// Leaflet accesses window on load, so SSR is disabled for the map.
const DataCentreMapClient = dynamic(
  () => import('@/components/DataCentreMapClient'),
  { ssr: false, loading: () => (
    <div
      className="page-panel flex items-center justify-center"
      style={{ height: '560px', color: 'var(--text-muted)', fontSize: '0.875rem' }}
    >
      Loading map...
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
      <main className="page-main">
        <PageHero
          eyebrow="Infrastructure"
          title={<>Canadian <span>data centres</span></>}
          description={`${DATA_CENTRES.length} facilities mapped across cloud regions, colocation providers, high-performance computing, and telecom infrastructure. Click any marker for details.`}
          stats={[
            { label: 'Facilities', value: `${DATA_CENTRES.length}` },
            { label: 'Types', value: `${ALL_TYPES.length}` },
            { label: 'View', value: 'Map' },
          ]}
        />

        <div className="page-section grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ALL_TYPES.filter(type => countByType[type] > 0).map(type => (
            <div key={type} className="page-panel px-4 py-3">
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

        <div className="page-section">
          <DataCentreMapClient />
        </div>
      </main>
      <DashboardFooter />
    </div>
  )
}
