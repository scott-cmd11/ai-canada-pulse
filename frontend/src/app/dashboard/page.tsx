import Header from "@/components/Header"
import PulseScore from "@/components/PulseScore"
import MetricStrip from "@/components/MetricStrip"
import BriefingCard from "@/components/BriefingCard"
import StoryFeed from "@/components/StoryFeed"

export default function DashboardPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f4f5f7" }}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Zone 1: Mood banner */}
        <PulseScore />

        {/* Zone 2: Quick status cards */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            What&apos;s happening
          </h2>
          <MetricStrip />
        </section>

        {/* Zone 3: Top story featured card */}
        <BriefingCard />

        {/* Zone 4: More stories */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            More stories
          </h2>
          <StoryFeed />
        </section>
      </main>

      <footer className="text-center text-xs text-gray-400 py-8">
        Canada&apos;s Pulse — public news and data for everyday Canadians
      </footer>
    </div>
  )
}
