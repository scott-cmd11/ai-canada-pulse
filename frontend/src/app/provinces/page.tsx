import type { Metadata } from 'next'
import Header from '@/components/Header'
import ProvinceIndex from '@/components/ProvinceIndex'
import DashboardFooter from '@/components/DashboardFooter'

export const metadata: Metadata = {
  title: 'Provinces',
  description: 'Explore AI developments across Canada\'s provinces and territories.',
}

export default function ProvincesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <Header />
      <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-primary)' }}>
            Provincial Intelligence
          </p>
          <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Canada by Province
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Track AI developments, institutions, research, and policy signals across all provinces and territories.
          </p>
        </div>
        <ProvinceIndex />
      </main>
      <DashboardFooter />
    </div>
  )
}
