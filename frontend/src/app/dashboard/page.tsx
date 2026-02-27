import Header from "@/components/Header"
import PulseScore from "@/components/PulseScore"
import BriefingCard from "@/components/BriefingCard"
import IndicatorsSection from "@/components/IndicatorsSection"
import TrendsSection from "@/components/TrendsSection"
import StoryFeed from "@/components/StoryFeed"
import AdoptionComparison from "@/components/AdoptionComparison"
import ResearchSection from "@/components/ResearchSection"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Sector Pulse — full width */}
        <PulseScore />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT: Stories + Research */}
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
          </div>

          {/* RIGHT: Economic Indicators + Visuals */}
          <div className="flex flex-col gap-8">
            {/* Economic Indicators */}
            <IndicatorsSection />

            {/* Google Trends: AI Search Interest in Canada */}
            <TrendsSection />

            {/* AI Adoption: Government vs Private Sector */}
            <AdoptionComparison />
          </div>

        </div>
      </main>

      <footer className="text-center text-xs text-slate-600 py-8 border-t border-slate-800">
        AI Canada Pulse — tracking artificial intelligence across Canada
      </footer>
    </div>
  )
}
