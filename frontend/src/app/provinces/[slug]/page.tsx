import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProvinceBySlug, getAllProvinceSlugs } from '@/lib/provinces-config';
import Header from '@/components/Header';
import ProvinceHero from '@/components/ProvinceHero';
import ProvinceStatsRibbon from '@/components/ProvinceStatsRibbon';
import ProvinceInstitutions from '@/components/ProvinceInstitutions';
import ParliamentSection from '@/components/ParliamentSection';
import StoryFeed from '@/components/StoryFeed';
import TrendsInsightsSection from '@/components/TrendsInsightsSection';
import JobMarketSection from '@/components/JobMarketSection';
import StocksSection from '@/components/StocksSection';
import ArxivSection from '@/components/ArxivSection';
import ScrollToTop from '@/components/ScrollToTop';

export function generateStaticParams() {
  return getAllProvinceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) return {};
  return {
    title: `${province.name} — AI Canada Pulse`,
    description: province.description,
  };
}

export default async function ProvincePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) return notFound();

  const instituteCount = province.institutions.filter((i) => i.type === 'institute').length;
  const instituteNames = province.institutions
    .filter((i) => i.type === 'institute')
    .map((i) => i.name)
    .join(' · ');

  const divider = (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--border-subtle)',
        maxWidth: '1080px',
        margin: '0 auto',
      }}
    />
  );

  return (
    <div>
      <Header />

      {/* Breadcrumb */}
      <nav
        style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          maxWidth: '1080px',
          margin: '0 auto',
          padding: '16px 40px',
        }}
      >
        <a
          href="/dashboard"
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Dashboard
        </a>
        <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--accent-primary)' }}>Provinces</span>
        <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          {province.name}
        </span>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 40px' }}>
        <ProvinceHero
          province={province}
          heroStat={{ value: '—', unit: 'AI positions', change: 'Loading...' }}
        />
      </div>

      {divider}

      {/* Stats ribbon */}
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 40px' }}>
        <ProvinceStatsRibbon
          stats={[
            {
              label: 'Search Interest',
              value: '—',
              note: 'Loading...',
              isPositive: false,
            },
            {
              label: 'AI Institutes',
              value: instituteCount > 0
                ? province.institutions.filter(i => i.type === 'institute').map(i => i.name).join(', ')
                : '—',
              note: instituteNames,
            },
            {
              label: 'Capital',
              value: province.capital,
              note: `Pop. ${province.population}`,
            },
          ]}
        />
      </div>

      {divider}

      {/* Institutions */}
      {province.institutions.length > 0 && (
        <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 40px' }}>
          <ProvinceInstitutions institutions={province.institutions} />
        </div>
      )}

      {divider}

      {/* Stories */}
      {province.sections.stories && (
        <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              marginBottom: '16px',
            }}
          >
            What&apos;s happening in {province.name}
          </h2>
          <StoryFeed region={province.name} />
        </section>
      )}

      {/* Trends */}
      {province.sections.trends && (
        <section
          style={{ maxWidth: '1080px', margin: '0 auto', padding: '8px 40px 40px' }}
        >
          <TrendsInsightsSection highlightProvince={province.abbreviation} />
        </section>
      )}

      {/* Jobs */}
      {province.sections.jobs && (
        <section
          style={{ maxWidth: '1080px', margin: '0 auto', padding: '8px 40px 40px' }}
        >
          <JobMarketSection region={province.slug} />
        </section>
      )}

      {/* Stocks */}
      {province.sections.stocks && (
        <section
          style={{ maxWidth: '1080px', margin: '0 auto', padding: '8px 40px 40px' }}
        >
          <StocksSection region={province.slug} />
        </section>
      )}

      {/* Research */}
      {province.sections.research && (
        <section
          style={{ maxWidth: '1080px', margin: '0 auto', padding: '8px 40px 40px' }}
        >
          <ArxivSection
            institutionFilter={province.institutions.map((i) => i.name)}
          />
        </section>
      )}

      {/* Parliament */}
      {province.sections.parliament && (
        <section
          style={{ maxWidth: '1080px', margin: '0 auto', padding: '8px 40px 40px' }}
        >
          <ParliamentSection />
        </section>
      )}

      {/* Footer nav */}
      <footer
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          padding: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <a
          href="/dashboard"
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          ← National dashboard
        </a>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Also explore:{' '}
          {province.neighborSlugs.map((ns, i) => {
            const neighbor = getProvinceBySlug(ns);
            return neighbor ? (
              <span key={ns}>
                {i > 0 && ' · '}
                <a
                  href={`/provinces/${ns}`}
                  style={{
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  {neighbor.name}
                </a>
              </span>
            ) : null;
          })}
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}
