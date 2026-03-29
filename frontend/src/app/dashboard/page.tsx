import type { Metadata } from "next"
import Header from "@/components/Header"
import BriefingCard from "@/components/BriefingCard"
import IndicatorsSection from "@/components/IndicatorsSection"
import TrendsSection from "@/components/TrendsSection"
import StoryFeed from "@/components/StoryFeed"
import SentimentSection from "@/components/SentimentSection"
import StocksSection from "@/components/StocksSection"
import TrendsInsightsSection from "@/components/TrendsInsightsSection"
import ResearchSection from "@/components/ResearchSection"
import OpenSourceSection from "@/components/OpenSourceSection"
import JobMarketSection from "@/components/JobMarketSection"
import ParliamentSection from "@/components/ParliamentSection"
import EcosystemSection from "@/components/EcosystemSection"
import RegulatorySection from "@/components/RegulatorySection"
import CollapsibleSection from "@/components/CollapsibleSection"
import SectionNav from "@/components/SectionNav"
import ScrollToTop from "@/components/ScrollToTop"
import ScrollReveal from "@/components/ScrollReveal"
import DashboardFooter from "@/components/DashboardFooter"
import SectionErrorBoundary from "@/components/SectionErrorBoundary"
import KeyboardShortcuts from "@/components/KeyboardShortcuts"
import { StoriesProvider } from "@/hooks/useStories"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Real-time Canadian AI intelligence dashboard. Track policy, research, industry, market, and job signals from 17+ public data sources.",
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

export default function DashboardPage() {
  return (
    <StoriesProvider>
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <Header />

      <main id="main-content" className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
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
        </section>

        <hr className="section-divider" />

        <ScrollReveal>
          <section id="impact" className="section-dark rounded-2xl p-5 sm:p-6">
            <SectionTitle
              eyebrow="Market And Policy Impact"
              title="Where acceleration is already visible"
              description="Focus on the areas where Canadian AI momentum is already showing up in market tone, public-company exposure, and economic indicators."
              dark
            />

            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <SectionErrorBoundary sectionName="Media Sentiment">
                <SentimentSection />
              </SectionErrorBoundary>
              <SectionErrorBoundary sectionName="Market Performance">
                <StocksSection />
              </SectionErrorBoundary>
            </div>

            <div className="mt-4">
              <SectionErrorBoundary sectionName="Pulse Indicators">
                <IndicatorsSection />
              </SectionErrorBoundary>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <SectionErrorBoundary sectionName="Labour Demand">
                <JobMarketSection />
              </SectionErrorBoundary>
              <SectionErrorBoundary sectionName="Parliament Activity">
                <ParliamentSection />
              </SectionErrorBoundary>
            </div>
          </section>
        </ScrollReveal>

        <hr className="section-divider" />

        <ScrollReveal>
          <section id="more" className="saas-card rounded-2xl p-5 sm:p-6">
            <SectionTitle
              eyebrow="More Signals"
              title="Deeper data on demand"
              description="Expand any section below to explore research output, adoption trends, ecosystem activity, and regulatory standing."
            />

            <CollapsibleSection title="AI Adoption Trends">
              <div className="grid gap-4 xl:grid-cols-2">
                <SectionErrorBoundary sectionName="AI Adoption Trends">
                  <TrendsSection />
                </SectionErrorBoundary>
                <SectionErrorBoundary sectionName="Provincial Search Interest">
                  <TrendsInsightsSection />
                </SectionErrorBoundary>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Research &amp; Open Source">
              <div className="grid gap-4 xl:grid-cols-2">
                <SectionErrorBoundary sectionName="Fundamental Research">
                  <ResearchSection />
                </SectionErrorBoundary>
                <SectionErrorBoundary sectionName="Open Source Activity">
                  <OpenSourceSection />
                </SectionErrorBoundary>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Ecosystem &amp; Startups">
              <SectionErrorBoundary sectionName="Ecosystem & Community">
                <EcosystemSection />
              </SectionErrorBoundary>
            </CollapsibleSection>

            <CollapsibleSection title="Regulatory &amp; Global Standing">
              <SectionErrorBoundary sectionName="Regulatory & Global Standing">
                <RegulatorySection />
              </SectionErrorBoundary>
            </CollapsibleSection>
          </section>
        </ScrollReveal>
      </main>

      <DashboardFooter />
      <ScrollToTop />
      <KeyboardShortcuts />
    </div>
    </StoriesProvider>
  )
}
