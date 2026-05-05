import Header from '@/components/Header'
import Link from 'next/link'
import { SOURCES } from '@/lib/source-registry'

export const metadata = {
  title: 'About',
  description: 'About AI Canada Pulse: what it is, where the data comes from, and what its limitations are.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '16px', marginBottom: '4px', fontSize: '14px' }}>
      {children}
    </h3>
  )
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 lg:px-10">
        <header style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '8px' }}>
            About
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            An independent monitor for Canadian AI signals
          </h1>
          <p style={{ marginTop: '10px', fontSize: '15px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            Tracking policy, research, industry, adoption, and public interest developments across Canada from {SOURCES.length} traceable public sources.
          </p>
        </header>

        <div className="space-y-10 py-8" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8 }}>
          <Section title="Project Overview">
            <p>
              AI Canada Pulse is an open-source intelligence monitor aggregating signals about AI developments in Canada from {SOURCES.length} public data sources.
            </p>
            <p className="mt-3">
              The project was built to make the Canadian AI landscape easier to monitor at a glance: official adoption tables, news, parliamentary activity, research output, job market signals, procurement demand, and economic indicators in a single dashboard.
            </p>
            <p className="mt-3">
              Source code is available on{' '}
              <a href="https://github.com/scott-cmd11" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                GitHub
              </a>.
            </p>
          </Section>

          <Section title="Operator">
            <p>
              This project is operated by <strong style={{ color: 'var(--text-primary)' }}>Scott Hazlitt</strong>, a private individual based in Winnipeg, Manitoba, Canada. It is a personal project exploring AI-assisted software development and public-interest data journalism.
            </p>
            <p className="mt-3">
              Scott works at the intersection of public policy, data, and technology. More at{' '}
              <a href="https://scotthazlitt.ai" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                scotthazlitt.ai
              </a>{' '}and{' '}
              <a href="https://www.linkedin.com/in/scott-hazlitt/" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                LinkedIn
              </a>.
            </p>
          </Section>

          <Section title="Data Sources & Methodology">
            <p>
              The dashboard aggregates from the following public sources. Refresh cadence depends on each source and is listed in the methodology page.
            </p>

            <H3>News & Media</H3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google News RSS</strong> - national and province-targeted queries for Canadian AI coverage</li>
              <li><strong>BetaKit</strong> - Canadian technology and startup news</li>
              <li><strong>CBC Technology</strong> - public broadcaster technology coverage</li>
            </ul>

            <H3>Government & Policy</H3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>OpenParliament.ca</strong> - parliamentary debate records referencing AI</li>
              <li><strong>Government of Canada AI Register</strong> - federal public-sector AI systems and pilots</li>
              <li><strong>Government of Canada open data</strong> - job postings, procurement notices, contracts, and related datasets</li>
            </ul>

            <H3>Research</H3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>arXiv</strong> - academic preprints from Canadian institutions</li>
              <li><strong>OpenAlex and NSERC</strong> - research metadata and grant signals</li>
              <li><strong>GitHub and Hugging Face</strong> - open-source and model-release ecosystem signals</li>
            </ul>

            <H3>Market & Economic</H3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Statistics Canada</strong> - official AI adoption tables plus macroeconomic context indicators</li>
              <li><strong>Job Bank Canada</strong> - AI-related job posting statistics</li>
              <li><strong>CanadaBuys and Contracts over $10,000</strong> - AI, automation, cloud, and data demand signals</li>
              <li><strong>Google Trends</strong> - provincial search interest in AI-related terms; proxy signal only</li>
              <li><strong>Yahoo Finance</strong> - delayed stock data for Canadian AI-adjacent public companies</li>
            </ul>

            <H3>AI Enrichment</H3>
            <p className="mt-2">
              Story summaries, executive briefs, daily digests, and deep-dive posts are generated with OpenAI models. All AI-generated content is labelled throughout the site. See the{' '}
              <Link href="/methodology" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                Methodology
              </Link>{' '}page for full pipeline details and the{' '}
              <Link href="/sources" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                Source Health
              </Link>{' '}page for live, stale, fallback, and curated source status.
            </p>
          </Section>

          <Section title="Key Disclaimers">
            <ul className="list-disc pl-5 space-y-2">
              <li>This is an independent personal project and does not represent any government, academic institution, or commercial entity.</li>
              <li>AI-generated summaries and analyses may contain errors, hallucinations, or misrepresentations. Always verify critical information with the linked primary sources.</li>
              <li>Procurement notices and contract samples are demand signals, not proof that AI has been adopted or delivered.</li>
              <li>Google Trends, GitHub, Hugging Face, and news volume are proxy signals only and should not be read as adoption rates.</li>
              <li>Market and stock data is delayed and should not be used for trading or investment decisions.</li>
              <li>Story classification by category, sentiment, region, and procurement topic is automated and imperfect.</li>
            </ul>
          </Section>

          <Section title="Corrections & Contact">
            <p>
              If you spot an error in AI-generated content, a misclassification, or a technical issue, contact{' '}
              <a href="mailto:scott@scotthazlitt.ai" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                scott@scotthazlitt.ai
              </a>. I aim to respond within 30 days.
            </p>
          </Section>

          <Section title="Accessibility & Open Source">
            <p>
              AI Canada Pulse targets <strong style={{ color: 'var(--text-primary)' }}>WCAG 2.1 Level AA</strong> conformance, with semantic HTML, keyboard navigation, and sufficient colour contrast.
            </p>
            <p className="mt-3">
              The source code is open. Built with Next.js, TypeScript, Tailwind CSS, and Vercel.
            </p>
          </Section>

          <p className="text-xs pt-4" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
            Last updated: May 4, 2026
          </p>
        </div>
      </main>
    </div>
  )
}
