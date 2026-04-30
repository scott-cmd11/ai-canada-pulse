import type { Metadata } from "next"
import Header from "@/components/Header"
import BriefingCard from "@/components/BriefingCard"
import IndicatorsSection from "@/components/IndicatorsSection"
import StoryFeed from "@/components/StoryFeed"
import SentimentSection from "@/components/SentimentSection"
import ResearchSection from "@/components/ResearchSection"
import ParliamentSection from "@/components/ParliamentSection"
import QuotesTeaser from "@/components/quotes/QuotesTeaser"
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

export const revalidate = 300

function SectionTitle({ eyebrow, title, description, dark }: { eyebrow: string; title: string; description: string; dark?: boolean }) {
  return (
    <div className="section-title mb-4 sm:mb-5" data-invert={dark ? "true" : "false"}>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span aria-hidden="true" />
      <p>{description}</p>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <StoriesProvider>
      <div className="min-h-screen" style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}>
        <Header />

        <main id="main-content" className="dashboard-main mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <section className="dashboard-hero" aria-labelledby="dashboard-title">
            <div>
              <p className="dashboard-kicker">
                <span aria-hidden="true" />
                Live / Public Intelligence
              </p>
              <h1 id="dashboard-title">
                AI activity in Canada, <span>measured</span> <em>hourly.</em>
              </h1>
            </div>

            <div className="dashboard-briefing-strip" aria-label="Dashboard coverage">
              <div>
                <span>Coverage</span>
                <strong>50 signals</strong>
              </div>
              <div>
                <span>Sources</span>
                <strong>Public feeds</strong>
              </div>
              <div>
                <span>Cadence</span>
                <strong>Live index</strong>
              </div>
            </div>
          </section>

          <SectionNav />

          <section id="acceleration" className="saas-card intelligence-section p-5 sm:p-6">
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

            <div className="mt-4">
              <SectionErrorBoundary sectionName="Quotes Archive">
                <QuotesTeaser />
              </SectionErrorBoundary>
            </div>
          </section>

          <hr className="section-divider" />

          <section id="impact" className="section-dark intelligence-section p-5 sm:p-6">
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

          <section id="more" className="saas-card intelligence-section p-5 sm:p-6">
            <SectionTitle
              eyebrow="More Signals"
              title="Deeper data on demand"
              description="Expand any section below to explore research output, adoption trends, ecosystem activity, and regulatory standing."
            />

            <CollapsibleSection
              title="Parliament"
              defaultOpen
              preview="Recent AI-related bills, debates, and committee activity"
            >
              <SectionErrorBoundary sectionName="Parliament Activity">
                <ParliamentSection />
              </SectionErrorBoundary>
            </CollapsibleSection>

            <CollapsibleSection
              title="Research"
              preview="Canadian arXiv papers, NSERC grants, and institute output"
            >
              <SectionErrorBoundary sectionName="Fundamental Research">
                <ResearchSection />
              </SectionErrorBoundary>
            </CollapsibleSection>

            <CollapsibleSection
              title="Ecosystem & Startups"
              preview="Canadian GitHub, HuggingFace, events, and community signals"
            >
              <SectionErrorBoundary sectionName="Ecosystem & Community">
                <EcosystemSection />
              </SectionErrorBoundary>
            </CollapsibleSection>

            <CollapsibleSection
              title="Regulatory & Global Standing"
              preview="Gov AI registry, OECD index, legislation tracking"
            >
              <SectionErrorBoundary sectionName="Regulatory & Global Standing">
                <RegulatorySection />
              </SectionErrorBoundary>
            </CollapsibleSection>
          </section>

          <div className="mx-auto mt-2 w-full max-w-xl">
            <SubscribeForm />
          </div>
        </main>

        <DashboardFooter />
        <ScrollToTop />
        <KeyboardShortcuts />
      </div>
    </StoriesProvider>
  )
}
