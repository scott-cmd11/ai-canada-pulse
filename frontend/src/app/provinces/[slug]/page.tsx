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
import TalentEducationSection from '@/components/TalentEducationSection';
import EcosystemSection from '@/components/EcosystemSection';
import ProvinceDataNotes from '@/components/ProvinceDataNotes';
import ScrollToTop from '@/components/ScrollToTop';
import DashboardFooter from '@/components/DashboardFooter';

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
    title: `${province.name} AI Intelligence`,
    description: `AI developments in ${province.name}: ${province.description}`,
    openGraph: {
      title: `${province.name} — AI Canada Pulse`,
      description: `AI developments in ${province.name}: ${province.description}`,
    },
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

  return (
    <div style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <Header />

      {/* Breadcrumb */}
      <nav id="main-content" className="mx-auto max-w-[1080px] px-4 py-4 text-[13px] sm:px-6 lg:px-10" style={{ color: 'var(--text-muted)' }}>
        <a href="/dashboard" className="font-medium hover:underline" style={{ color: 'var(--accent-primary)' }}>
          Dashboard
        </a>
        <span className="mx-2" style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--accent-primary)' }}>Provinces</span>
        <span className="mx-2" style={{ color: 'var(--text-muted)' }}>/</span>
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {province.name}
        </span>
      </nav>

      {/* Hero */}
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-10">
        <ProvinceHero
          province={province}
          heroStat={{
            value: province.institutions.length > 0 ? String(province.institutions.length) : '—',
            unit: province.institutions.length === 1 ? 'Key institution' : 'Key institutions',
            change: province.region === 'North' ? 'Northern Canada' : `${province.region} Canada`,
          }}
        />
      </div>

      <hr className="mx-auto max-w-[1080px] border-0" style={{ borderTop: '1px solid var(--border-subtle)' }} />

      {/* Stats ribbon */}
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-10">
        <ProvinceStatsRibbon
          stats={[
            {
              label: 'Search Interest',
              value: '—',
              note: province.sections.trends ? 'See trends section below' : 'Not tracked',
            },
            {
              label: 'AI Institutes',
              value: instituteCount > 0
                ? province.institutions.filter(i => i.type === 'institute').map(i => i.name).join(', ')
                : '—',
              note: instituteCount > 0 ? instituteNames : 'University-based research only',
            },
            {
              label: 'Capital',
              value: province.capital,
            },
            {
              label: `${province.name} population`,
              value: province.population >= 1
                ? `${province.population.toFixed(1)}M`
                : `${Math.round(province.population * 1000)}K`,
              note: province.populationAsOf,
            },
          ]}
        />
      </div>

      <hr className="mx-auto max-w-[1080px] border-0" style={{ borderTop: '1px solid var(--border-subtle)' }} />

      {/* Institutions */}
      {province.institutions.length > 0 && (
        <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 lg:px-10">
          <ProvinceInstitutions institutions={province.institutions} />
        </div>
      )}

      {province.institutions.length > 0 && (
        <hr className="mx-auto max-w-[1080px] border-0" style={{ borderTop: '1px solid var(--border-subtle)' }} />
      )}

      {/* Stories */}
      {province.sections.stories && (
        <section className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <h2
            className="mb-4 text-2xl font-semibold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            What&apos;s happening in {province.name}
          </h2>
          <StoryFeed region={province.name} />
        </section>
      )}

      {/* Trends */}
      {province.sections.trends && (
        <section className="mx-auto max-w-[1080px] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-10">
          <TrendsInsightsSection highlightProvince={province.abbreviation} />
        </section>
      )}

      {/* Jobs */}
      {province.sections.jobs && (
        <section className="mx-auto max-w-[1080px] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-10">
          <JobMarketSection region={province.slug} />
        </section>
      )}

      {/* Stocks */}
      {province.sections.stocks && (
        <section className="mx-auto max-w-[1080px] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-10">
          <StocksSection region={province.slug} />
        </section>
      )}

      {/* Research */}
      {province.sections.research && (
        <section className="mx-auto max-w-[1080px] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-10">
          <ArxivSection
            institutionFilter={province.institutions.map((i) => i.name)}
          />
        </section>
      )}

      {/* Parliament */}
      {province.sections.parliament && (
        <section className="mx-auto max-w-[1080px] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-10">
          <ParliamentSection />
        </section>
      )}

      {/* Talent & Education */}
      {province.sections.talent && (
        <section className="mx-auto max-w-[1080px] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-10">
          <h2
            className="mb-4 text-2xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
          >
            Talent & Education
          </h2>
          <TalentEducationSection provinceFilter={province.slug} />
        </section>
      )}

      {/* Ecosystem & Community */}
      {(province.sections.startups || province.sections.events) && (
        <section className="mx-auto max-w-[1080px] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-10">
          <h2
            className="mb-4 text-2xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
          >
            Ecosystem & Community
          </h2>
          <EcosystemSection provinceFilter={province.slug} />
        </section>
      )}

      {/* Data notes */}
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-10">
        <ProvinceDataNotes province={province} />
      </div>

      {/* Footer nav */}
      <footer
        className="mx-auto flex max-w-[1080px] flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-10 lg:px-10"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <a
          href="/dashboard"
          className="text-sm font-semibold hover:underline"
          style={{ color: 'var(--accent-primary)' }}
        >
          ← National dashboard
        </a>
        <div className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Also explore:{' '}
          {province.neighborSlugs.map((ns, i) => {
            const neighbor = getProvinceBySlug(ns);
            return neighbor ? (
              <span key={ns}>
                {i > 0 && ' · '}
                <a
                  href={`/provinces/${ns}`}
                  className="font-medium hover:underline"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  {neighbor.name}
                </a>
              </span>
            ) : null;
          })}
        </div>
      </footer>

      <DashboardFooter />
      <ScrollToTop />
    </div>
  );
}
