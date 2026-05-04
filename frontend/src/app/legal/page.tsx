import Header from '@/components/Header'
import Link from 'next/link'

export const metadata = {
  title: 'Legal & Privacy',
  description: 'Privacy policy, terms of use, AI-generated content disclosure, and copyright attribution.',
}

export default function LegalPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <main className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 lg:px-10">
        <header style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '8px' }}>
            Legal
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Privacy, Terms & Disclosures
          </h1>
        </header>

        <div className="space-y-10 py-8" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8 }}>
          {/* Privacy Policy */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Privacy Policy
            </h2>
            <p>
              AI Canada Pulse is a personal project operated from Winnipeg, Manitoba, Canada. This policy explains how we handle information in compliance with the <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA).
            </p>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '16px', marginBottom: '4px', fontSize: '14px' }}>
              What we collect
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Analytics:</strong> We use Vercel Analytics, a first-party, privacy-friendly analytics service. It collects anonymised page-view data (no cookies, no personal identifiers). No data is sold or shared with third parties.</li>
              <li><strong>Server logs:</strong> Standard web server logs (IP address, user agent, request URL) are retained by Vercel for operational purposes and automatically purged.</li>
              <li><strong>Local storage:</strong> Your theme preference (light/dark) is stored in your browser&apos;s localStorage. This never leaves your device.</li>
              <li><strong>Email address (optional):</strong> If you subscribe to our weekly newsletter, we collect your email address with your explicit consent. Your email is stored securely in Supabase (Postgres) and is used solely to send you a weekly summary of Canadian AI developments. We never share, sell, or use your email for any other purpose. You can unsubscribe at any time via the link in every email.</li>
            </ul>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '16px', marginBottom: '4px', fontSize: '14px' }}>
              What we do not collect
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>We do not use tracking cookies or third-party analytics.</li>
              <li>We do not collect names or any personally identifiable information beyond the email address you voluntarily provide when subscribing to our newsletter.</li>
              <li>We do not require account creation or login.</li>
            </ul>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '16px', marginBottom: '4px', fontSize: '14px' }}>
              CASL Compliance
            </h3>
            <p>
              We comply with Canada&apos;s Anti-Spam Legislation (CASL). We use double opt-in: you must confirm your subscription via email before receiving any newsletters. Every email includes an unsubscribe link that takes effect immediately. We identify ourselves clearly in every communication.
            </p>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '16px', marginBottom: '4px', fontSize: '14px' }}>
              Contact
            </h3>
            <p>
              For privacy enquiries, contact <a href="mailto:scott@scotthazlitt.ai" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>scott@scotthazlitt.ai</a>.
            </p>
          </section>

          {/* Terms of Use */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Terms of Use
            </h2>
            <p>
              AI Canada Pulse is provided &ldquo;as is&rdquo; without warranty of any kind. By using this site, you acknowledge that:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Content is for informational purposes only and does not constitute professional, financial, or legal advice.</li>
              <li>Market data is delayed and should not be used for trading decisions.</li>
              <li>AI-generated content may contain inaccuracies (see disclosure below).</li>
            </ul>
          </section>

          {/* AI-Generated Content Disclosure */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              AI-Generated Content Disclosure
            </h2>
            <p>
              This platform uses artificial intelligence models (OpenAI) to generate the following content:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Article summaries</strong> — condensed versions of news articles from public RSS feeds</li>
              <li><strong>Executive briefs</strong> — daily bullet-point overviews of Canadian AI developments</li>
              <li><strong>Deep dives</strong> — long-form analytical posts generated when significant events are detected</li>
              <li><strong>Section insights</strong> — one-sentence AI-generated summaries shown above each dashboard section (marked with &#10022;)</li>
              <li><strong>Daily digests</strong> — structured summaries of the day&apos;s key developments</li>
              <li><strong>Sentiment classification</strong> — automated categorisation of story sentiment and topic</li>
            </ul>
            <p className="mt-3">
              AI-generated content is clearly labelled throughout the site. It is produced by language models and <strong>may contain errors, hallucinations, or misrepresentations</strong>. Always verify critical information with the linked primary sources.
            </p>
          </section>

          {/* Copyright & Attribution */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Copyright & Attribution
            </h2>
            <p>
              News content displayed on this site is aggregated from publicly available RSS feeds under the fair dealing provisions of the <em>Copyright Act</em> (R.S.C., 1985, c. C-42) for the purposes of news reporting, research, and commentary. Sources include:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Google News RSS (filtered for Canadian AI content)</li>
              <li>BetaKit (Canadian technology news)</li>
              <li>CBC Technology</li>
              <li>OpenParliament.ca (parliamentary records)</li>
              <li>arXiv (academic preprints)</li>
            </ul>
            <p className="mt-3">
              All stories link back to their original source. If you are a content owner and have concerns about how your content is displayed, please contact <a href="mailto:scott@scotthazlitt.ai" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>scott@scotthazlitt.ai</a>.
            </p>
            <p className="mt-3">
              Population data is sourced from Statistics Canada, Table 17-10-0009-01, &ldquo;Population estimates, quarterly&rdquo; (Q4 2025, January 1, 2026).
            </p>
          </section>

          {/* Accessibility */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Accessibility
            </h2>
            <p>
              We are committed to making AI Canada Pulse accessible to all users, in alignment with the <em>Accessibility for Manitobans Act</em> (AMA) and the <em>Accessible Canada Act</em>. The site targets WCAG 2.1 AA compliance. If you encounter accessibility barriers, please contact us at <a href="mailto:scott@scotthazlitt.ai" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>scott@scotthazlitt.ai</a>.
            </p>
          </section>

          <p className="text-xs pt-4" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
            Last updated: April 8, 2026
          </p>
        </div>
      </main>
    </div>
  )
}
