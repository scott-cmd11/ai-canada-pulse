import Header from "@/components/Header"
import BriefingCard from "@/components/BriefingCard"
import ExecutiveBriefSection from "@/components/ExecutiveBriefSection"
import IndicatorsSection from "@/components/IndicatorsSection"
import TrendsSection from "@/components/TrendsSection"
import StoryFeed from "@/components/StoryFeed"
import SentimentSection from "@/components/SentimentSection"
import StocksSection from "@/components/StocksSection"
import ComputeStatusSection from "@/components/ComputeStatusSection"
import TrendsInsightsSection from "@/components/TrendsInsightsSection"
import LabFeedsSection from "@/components/LabFeedsSection"
import ProvinceIndex from '@/components/ProvinceIndex'
import SectionNav from "@/components/SectionNav"
import ScrollToTop from "@/components/ScrollToTop"
import ScrollReveal from "@/components/ScrollReveal"
import DashboardFooter from "@/components/DashboardFooter"
import { StoriesProvider } from "@/hooks/useStories"

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-4 sm:mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-primary)' }}>{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <StoriesProvider>
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <Header />

      <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section id="provinces">
          <ProvinceIndex />
        </section>

        <SectionNav />

        <section id="acceleration" className="saas-card rounded-2xl p-5 sm:p-6">
          <SectionTitle
            eyebrow="Acceleration Signals"
            title="The shortest path to the Canadian story"
            description="Start with the highest-priority Canada development, then move to the machine-assisted synthesis and the curated signal stream beneath it."
          />

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <BriefingCard />
            <ExecutiveBriefSection />
          </div>

          <div className="mt-4">
            <StoryFeed />
          </div>
        </section>

        <ScrollReveal>
          <section id="capacity" className="saas-card rounded-2xl p-5 sm:p-6">
            <SectionTitle
              eyebrow="Canada Capacity"
              title="Evidence that the ecosystem is building"
              description="These modules answer whether Canada is adding capability through adoption, compute availability, and lab activity rather than just generating headlines."
            />

            <div className="grid gap-4 xl:grid-cols-2">
              <TrendsSection />
              <TrendsInsightsSection />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <ComputeStatusSection />
              <LabFeedsSection />
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section id="impact" className="saas-card rounded-2xl p-5 sm:p-6">
            <SectionTitle
              eyebrow="Market And Policy Impact"
              title="Where acceleration is already visible"
              description="Focus on the areas where Canadian AI momentum is already showing up in market tone, public-company exposure, and economic indicators."
            />

            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <SentimentSection />
              <StocksSection />
            </div>

            <div className="mt-4">
              <IndicatorsSection />
            </div>
          </section>
        </ScrollReveal>
      </main>

      <DashboardFooter />
      <ScrollToTop />
    </div>
    </StoriesProvider>
  )
}
