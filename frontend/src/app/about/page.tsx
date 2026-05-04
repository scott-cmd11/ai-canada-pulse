import Header from '@/components/Header'
import Link from 'next/link'

export const metadata = {
  title: 'About',
  description: 'About this project: what it is, who built it, where the data comes from, and what its limitations are.',
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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            An independent monitor for Canadian AI signals
          </h1>
          <p style={{ marginTop: '10px', fontSize: '15px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            Tracking policy, research, industry, and public interest developments across Canada — aggregated from 17+ public sources and refreshed daily.
          </p>
        </header>

        <div className="space-y-10 py-8" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8 }}>

          <Section title="Project Overview">
            <p>
              AI Canada Pulse is an open-source intelligence monitor aggregating signals about AI developments in Canada from 17+ public data sources.
            </p>
            <p className="mt-3">
              The project was built to make the Canadian AI landscape easier to monitor at a glance — surfacing news, parliamentary activity, research output, job market signals, and economic indicators in a single daily-refreshed dashboard.
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
              The dashboard aggregates from the following public sources, refreshed daily via an automated cron job:
            </p>

            <H3>News & Media</H3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google News RSS</strong> — national and province-targeted queries for Canadian AI coverage</li>
              <li><strong>BetaKit</strong> — Canadian technology and startup news</li>
              <li><strong>CBC Technology</strong> — public broadcaster technology coverage</li>
            </ul>

            <H3>Government & Policy</H3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>OpenParliament.ca</strong> — parliamentary debate records referencing AI</li>
              <li><strong>Government of Canada open data</strong> — job postings, immigration, and procurement data</li>
            </ul>

            <H3>Research</H3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>arXiv</strong> — academic preprints from Canadian institutions (cs.AI, cs.LG, stat.ML)</li>
              <li><strong>GitHub</strong> — Canadian AI open-source repository activity</li>
              <li><strong>Hugging Face</strong> — Canadian model and dataset releases</li>
            </ul>

            <H3>Market & Economic</H3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Yahoo Finance</strong> — delayed stock data for Canadian AI-adjacent public companies</li>
              <li><strong>Job Bank Canada</strong> — AI-related job posting statistics</li>
              <li><strong>Statistics Canada</strong> — population data (Table 17-10-0009-01, Q4 2025)</li>
              <li><strong>Google Trends</strong> — provincial search interest in AI-related terms</li>
            </ul>

            <H3>AI Enrichment</H3>
            <p className="mt-2">
              Story summaries, executive briefs, daily digests, and deep-dive posts are generated using <strong>OpenAI gpt-4o-mini</strong>. All AI-generated content is clearly labelled throughout the site. See the{' '}
              <Link href="/methodology" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                Methodology
              </Link>{' '}page for full pipeline details.
            </p>
          </Section>

          <Section title="Key Disclaimers">
            <ul className="list-disc pl-5 space-y-2">
              <li>This is an independent personal project and does not represent any government, academic institution, or commercial entity.</li>
              <li>AI-generated summaries and analyses may contain errors, hallucinations, or misrepresentations. Always verify critical information with the linked primary sources.</li>
              <li>Market and stock data is delayed and should not be used for trading or investment decisions.</li>
              <li>Story classification (category, sentiment, region) is automated and imperfect. Misclassifications will occur.</li>
              <li>Data freshness depends on upstream source availability. Feeds may occasionally fail or return stale results.</li>
            </ul>
          </Section>

          <Section title="Corrections & Contact">
            <p>
              If you spot an error in AI-generated content, a misclassification, or a technical issue, contact{' '}
              <a href="mailto:scott@scotthazlitt.ai" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                scott@scotthazlitt.ai
              </a>. I aim to respond within 30 days.
            </p>
            <p className="mt-3">
              For concerns about how news content is displayed, please also contact the same address. Note that parliamentary and government data corrections must be directed to the originating source (OpenParliament.ca or the Government of Canada).
            </p>
          </Section>

          <Section title="Accessibility & Open Source">
            <p>
              AI Canada Pulse targets <strong>WCAG 2.1 Level AA</strong> conformance, with semantic HTML, keyboard navigation, and sufficient colour contrast. If you encounter accessibility barriers, please contact{' '}
              <a href="mailto:scott@scotthazlitt.ai" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                scott@scotthazlitt.ai
              </a>.
            </p>
            <p className="mt-3">
              The source code is open. Built with Next.js, TypeScript, Tailwind CSS, and Vercel.
            </p>
          </Section>

          <p className="text-xs pt-4" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
            Last updated: April 5, 2026
          </p>
        </div>
      </main>
    </div>
  )
}
