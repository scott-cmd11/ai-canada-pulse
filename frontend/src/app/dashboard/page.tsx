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
import { relativeTime } from "@/lib/relative-time"
import OperationalStatus from "@/components/OperationalStatus"

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
      <p className="section-kicker" style={{ color: dark ? 'var(--accent-on-invert)' : undefined }}>{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-ui)', color: dark ? 'var(--text-on-invert)' : 'var(--text-primary)', fontWeight: 740 }}>{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: dark ? 'var(--text-on-invert-secondary)' : 'var(--text-secondary)' }}>{description}</p>
    </div>
  )
}

function getTopCategory(stories: StoriesInitialData["stories"]) {
  const categoryCounts = new Map<string, number>()
  stories.slice(0, 20).forEach((story) => {
    categoryCounts.set(story.category, (categoryCounts.get(story.category) ?? 0) + 1)
  })
  return Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Canadian AI"
}

function DashboardHero({ initialStories }: { initialStories: StoriesInitialData | null }) {
  const stories = initialStories?.stories ?? []
  const pulse = initialStories?.pulse ?? null
  const executiveBrief = initialStories?.executiveBrief ?? []
  const sourceCount = new Set(stories.map((story) => story.sourceName).filter(Boolean)).size
  const topCategory = getTopCategory(stories)
  const latestStory = stories[0]
  const updatedLabel = pulse?.updatedAt ? relativeTime(pulse.updatedAt) : "Live snapshot"
  const briefLine =
    executiveBrief[0] ??
    initialStories?.summary ??
    "A source-linked scan of Canadian AI policy, research, markets, and public institutions."

  const metrics = [
    { label: "Signals tracked", value: stories.length ? stories.length.toString() : "Live" },
    { label: "Sources", value: sourceCount ? sourceCount.toString() : "Public" },
    { label: "Top lane", value: topCategory.replace("Industry & Startups", "Markets") },
  ]

  return (
    <section className="briefing-hero">
      <div className="briefing-hero__main">
        <p className="section-kicker">Live / Public Intelligence</p>
        <h1 className="briefing-hero__title">
          AI activity in Canada, <span>measured</span>{" "}
          <em>hourly.</em>
        </h1>
        <p className="briefing-hero__copy">
          A live, source-linked briefing across policy, research, markets, and public institutions.
        </p>
        <div className="briefing-hero__actions" aria-label="Primary dashboard actions">
          <a href="#acceleration" className="briefing-action briefing-action--primary">
            Start with signals
          </a>
          <a href="/methodology" className="briefing-action">
            View methodology
          </a>
        </div>
      </div>

      <aside className="briefing-panel" aria-label="Current briefing status">
        <div className="briefing-panel__header">
          <span className="live-dot" aria-hidden="true" />
          <span>{pulse?.moodLabel ?? "Live index"}</span>
          <span>{updatedLabel}</span>
        </div>
        <p className="briefing-panel__brief">{briefLine}</p>
        <div className="briefing-metrics">
          {metrics.map((metric) => (
            <div key={metric.label} className="briefing-metric">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
        {latestStory && (
          <a href={latestStory.sourceUrl ?? "#acceleration"} className="briefing-latest">
            <span>Latest signal</span>
            <strong>{latestStory.headline}</strong>
          </a>
        )}
      </aside>
    </section>
  )
}

export default async function DashboardPage() {
  const initialStories = await loadInitialStories()
  return (
    <StoriesProvider initialData={initialStories}>
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <Header />
      <OperationalStatus />

      <main id="main-content" className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
        <DashboardHero initialStories={initialStories} />

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

          <div className="mt-4">
            <SectionErrorBoundary sectionName="Quotes Archive">
              <QuotesTeaser />
            </SectionErrorBoundary>
          </div>
        </section>

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
