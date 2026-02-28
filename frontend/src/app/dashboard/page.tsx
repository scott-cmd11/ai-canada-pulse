import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"
import BriefingCard from "@/components/BriefingCard"
import IndicatorsSection from "@/components/IndicatorsSection"
import TrendsSection from "@/components/TrendsSection"
import StoryFeed from "@/components/StoryFeed"
import AdoptionComparison from "@/components/AdoptionComparison"
import ResearchSection from "@/components/ResearchSection"
import GovRegistrySection from "@/components/GovRegistrySection"
import ParliamentSection from "@/components/ParliamentSection"
import JobMarketSection from "@/components/JobMarketSection"
import SentimentSection from "@/components/SentimentSection"
import StocksSection from "@/components/StocksSection"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Hero — full width */}
        <HeroSection />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT: Stories + Research + Policy */}
          <div className="flex flex-col gap-8">
            {/* Top Story */}
            <BriefingCard />

            {/* Stories Feed */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
                Latest Stories
              </h2>
              <StoryFeed />
            </section>

            {/* Canadian AI Research */}
            <ResearchSection />

            {/* Federal AI Systems Registry */}
            <GovRegistrySection />

            {/* AI in Parliament */}
            <ParliamentSection />
          </div>

          {/* RIGHT: Economic Indicators + Visuals + Market */}
          <div className="flex flex-col gap-8">
            {/* Economic Indicators */}
            <IndicatorsSection />

            {/* Google Trends: AI Search Interest in Canada */}
            <TrendsSection />

            {/* Media Sentiment (GDELT) */}
            <SentimentSection />

            {/* AI Adoption: Government vs Private Sector */}
            <AdoptionComparison />

            {/* Canadian AI Stocks */}
            <StocksSection />

            {/* AI Job Market */}
            <JobMarketSection />
          </div>

        </div>
      </main>

      <footer className="text-center text-xs text-slate-600 py-8 border-t border-slate-800">
        AI Canada Pulse — tracking artificial intelligence across Canada
      </footer>
    </div>
  )
}
