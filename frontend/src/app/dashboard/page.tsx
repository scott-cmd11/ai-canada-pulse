import Header from "@/components/Header"
import PulseScore from "@/components/PulseScore"
import MetricStrip from "@/components/MetricStrip"
import BriefingCard from "@/components/BriefingCard"
import IndicatorsSection from "@/components/IndicatorsSection"
import StoryFeed from "@/components/StoryFeed"
import AnimatedSection from "@/components/AnimatedSection"

export default function DashboardPage() {
  return (
    <div className="min-h-screen pulse-bg">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Zone 1: AI Pulse mood banner */}
        <AnimatedSection>
          <PulseScore />
        </AnimatedSection>

        {/* Zone 2: Quick status cards */}
        <AnimatedSection delay={80}>
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              What&apos;s happening in AI
            </h2>
            <MetricStrip />
          </section>
        </AnimatedSection>

        {/* Zone 3: Economic indicators */}
        <IndicatorsSection />

        {/* Zone 4: Top story featured card */}
        <BriefingCard />

        {/* Zone 5: More stories */}
        <AnimatedSection delay={40}>
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              More stories
            </h2>
            <StoryFeed />
          </section>
        </AnimatedSection>
      </main>

      <footer className="text-center text-xs text-gray-400 py-8">
        AI Canada Pulse — tracking artificial intelligence across Canada
      </footer>
    </div>
  )
}
