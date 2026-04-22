import type { Metadata } from "next"
import { fetchAllStories, derivePulseFromStories } from "@/lib/rss-client"
import { hydrateCanadaStories } from "@/lib/dashboard-enrichment"
import { getSectionSummary } from "@/lib/section-summaries-client"
import type { StoriesInitialData } from "@/hooks/useStories"
import Header from "@/components/Header"
import BriefingCard from "@/components/BriefingCard"
import IndicatorsSection from "@/components/IndicatorsSection"
import StoryFeed from "@/components/StoryFeed"
import SentimentSection from "@/components/SentimentSection"
import ResearchSection from "@/components/ResearchSection"
import ParliamentSection from "@/components/ParliamentSection"
import EcosystemSection from "@/components/EcosystemSection"
import RegulatorySection from "@/components/RegulatorySection"
import CollapsibleSection from "@/components/CollapsibleSection"
import SectionNav from "@/components/SectionNav"
import ScrollToTop from "@/components/ScrollToTop"
import SubscribeForm from "@/components/SubscribeForm"
import DashboardFooter from "@/components/DashboardFooter"
import SectionErrorBoundary from "@/components/SectionErrorBoundary"
import KeyboardShortcuts from "@/components/KeyboardShortcuts"
import { StoriesProvider } from "@/hooks/useStories"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Real-time Canadian AI intelligence dashboard. Track policy, research, industry, market, and job signals from 17+ public data sources.",
}

// Revalidate the server-fetched snapshot every 60s. Keeps first paint fast
// (CDN-cached), while client polling (2-min) still refreshes live views.
export const revalidate = 60

async function loadInitialStories(): Promise<StoriesInitialData | null> {
  try {
    const stories = await fetchAllStories()
    const { stories: enrichedStories, executiveBrief } = await hydrateCanadaStories(stories)
    const pulse = derivePulseFromStories(enrichedStories)
    const summary = await getSectionSummary("stories").catch(() => null)
    return {
      stories: enrichedStories,
      pulse,
      executiveBrief: executiveBrief ?? [],
      summary,
    }
  } catch (err) {
    console.warn("[dashboard/page] Failed to preload stories:", err)
    return null
  }
}

function SectionTitle({ eyebrow, title, description, dark }: { eyebrow: string; title: string; description: string; dark?: boolean }) {
  return (
    <div className="mb-4 sm:mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: dark ? 'var(--accent-on-invert)' : 'var(--accent-primary)' }}>{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-display)', color: dark ? 'var(--text-on-invert)' : 'var(--text-primary)', fontWeight: 600 }}>{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: dark ? 'var(--text-on-invert-secondary)' : 'var(--text-secondary)' }}>{description}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const initialStories = await loadInitialStories()
  return (
    <StoriesProvider initialData={initialStories}>
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <Header />

      <main id="main-content" className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="pt-1 sm:pt-2">
          <p
            className="flex items-center gap-3 text-[11px] uppercase"
            style={{
              fontFamily: 'var(--font-mono), monospace',
              letterSpacing: '0.16em',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            <span style={{ color: 'var(--accent-primary)' }}>● Live</span>
            <span aria-hidden style={{ color: 'var(--border-strong)' }}>/</span>
            <span>Vol III · Public Intelligence</span>
          </p>
          <h1
            className="mt-3 max-w-[22ch] text-[clamp(32px,5vw,68px)] leading-[0.96] uppercase"
            style={{
              fontFamily: 'var(--font-display), "Archivo Black", sans-serif',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
            }}
          >
            AI activity in Canada,{' '}
            <span style={{ color: 'var(--accent-primary)' }}>measured</span>{' '}
            <span
              style={{
                fontFamily: 'var(--font-italic), Georgia, serif',
                fontStyle: 'italic',
                textTransform: 'lowercase',
                letterSpacing: '-0.01em',
                fontWeight: 400,
              }}
            >
              hourly.
            </span>
          </h1>
        </div>

        <SectionNav />

        <section id="acceleration" className="saas-card rounded-2xl p-5 sm:p-6">
          <SectionTitle
            eyebrow="Acceleration Signals"
            title="The shortest path to the Canadian story"
            description="Start with the highest-priority Canada development, then move to the curated signal stream beneath it."
          />

          <div className="mt-4">
            <SectionErrorBoundary sectionName="Lead Signal">
              <BriefingCard />
            </SectionErrorBoundary>
          </div>

          <div className="mt-4">
            <SectionErrorBoundary sectionName="Story Feed">
              <StoryFeed />
            </SectionErrorBoundary>
          </div>

          <div className="mt-4">
            <SectionErrorBoundary sectionName="Media Sentiment">
              <SentimentSection />
            </SectionErrorBoundary>
          </div>
        </section>

        <div className="mx-auto max-w-xl">
          <SubscribeForm />
        </div>

        <hr className="section-divider" />

        <section id="impact" className="section-dark rounded-2xl p-5 sm:p-6">
          <SectionTitle
            eyebrow="Market And Policy Impact"
            title="Indicators that may signal AI adoption"
            description="Macro and market data that could reflect AI-driven shifts in the Canadian economy."
            dark
          />

          <div>
            <SectionErrorBoundary sectionName="Pulse Indicators">
              <IndicatorsSection />
            </SectionErrorBoundary>
          </div>
        </section>

        <hr className="section-divider" />

        <section id="more" className="saas-card rounded-2xl p-5 sm:p-6">
          <SectionTitle
            eyebrow="More Signals"
            title="Deeper data on demand"
            description="Expand any section below to explore research output, adoption trends, ecosystem activity, and regulatory standing."
          />

          <CollapsibleSection title="Parliament">
            <SectionErrorBoundary sectionName="Parliament Activity">
              <ParliamentSection />
            </SectionErrorBoundary>
          </CollapsibleSection>

          <CollapsibleSection title="Research">
            <SectionErrorBoundary sectionName="Fundamental Research">
              <ResearchSection />
            </SectionErrorBoundary>
          </CollapsibleSection>

          <CollapsibleSection title="Ecosystem & Startups">
            <SectionErrorBoundary sectionName="Ecosystem & Community">
              <EcosystemSection />
            </SectionErrorBoundary>
          </CollapsibleSection>

          <CollapsibleSection title="Regulatory & Global Standing">
            <SectionErrorBoundary sectionName="Regulatory & Global Standing">
              <RegulatorySection />
            </SectionErrorBoundary>
          </CollapsibleSection>
        </section>
      </main>

      <DashboardFooter />
      <ScrollToTop />
      <KeyboardShortcuts />
    </div>
    </StoriesProvider>
  )
}
