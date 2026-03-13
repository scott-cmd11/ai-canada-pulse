import Header from "@/components/Header"
import HeroBanner from "@/components/HeroBanner"
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
import METRHeroChart from "@/components/METRHeroChart"
import SectionNav from "@/components/SectionNav"
import ScrollToTop from "@/components/ScrollToTop"
import ScrollReveal from "@/components/ScrollReveal"
import DashboardFooter from "@/components/DashboardFooter"

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-4 sm:mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #312e81 50%, #1e1b4b 75%, #0f172a 100%)",
              backgroundSize: "400% 400%",
              animation: "gradientShift 12s ease infinite",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='0.5'%3E%3Cpath d='M0 30h60M30 0v60'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-500/25 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />

          <div className="grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative z-10">
              <HeroBanner embedded />
            </div>
            <div className="relative z-10 border-t border-white/5 bg-white/0 p-5 lg:border-l lg:border-t-0 lg:p-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">Capability benchmark</p>
                  <h2 className="mt-1 text-lg font-bold text-white">Why the pace of AI capability matters now</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-indigo-100/65">A condensed METR benchmark anchors the dashboard with the clearest external evidence that frontier models are advancing fast enough to reshape the Canadian signal environment.</p>
                </div>
              </div>
              <METRHeroChart />
            </div>
          </div>
        </div>

        <SectionNav />

        <ScrollReveal>
          <section id="acceleration" className="rounded-2xl border border-slate-200 bg-white/60 p-5 sm:p-6">
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
        </ScrollReveal>

        <ScrollReveal>
          <section id="capacity" className="rounded-2xl border border-slate-200 bg-white/60 p-5 sm:p-6">
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
          <section id="impact" className="rounded-2xl border border-slate-200 bg-white/60 p-5 sm:p-6">
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
  )
}
