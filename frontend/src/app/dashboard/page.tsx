import Link from "next/link"
import Header from "@/components/Header"
import HeroBanner from "@/components/HeroBanner"
import BriefingCard from "@/components/BriefingCard"
import ExecutiveBriefSection from "@/components/ExecutiveBriefSection"
import IndicatorsSection from "@/components/IndicatorsSection"
import TrendsSection from "@/components/TrendsSection"
import StoryFeed from "@/components/StoryFeed"
import SentimentSection from "@/components/SentimentSection"
import StocksSection from "@/components/StocksSection"
import ArxivSection from "@/components/ArxivSection"
import ComputeStatusSection from "@/components/ComputeStatusSection"
import TrendsInsightsSection from "@/components/TrendsInsightsSection"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col gap-4">

        <HeroBanner />

        {/* ── Full-width Briefing ── */}
        <div>
          <div className="section-header">
            <h2>Top Briefing</h2>
          </div>
          <BriefingCard />
        </div>

        {/* ── ROW 1: Economic Indicators (Full Width) ── */}
        <IndicatorsSection />

        {/* ── ROW 2: Latest Developments | Sidebar (Executive Brief + Adoption + Sentiment + Compute + Trends) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-start">

          <div className="xl:col-span-7 flex flex-col gap-4">
            <div>
              <div className="section-header flex items-center justify-between">
                <h2>Latest Developments</h2>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  REAL-TIME
                </span>
              </div>
              <StoryFeed />
            </div>

            {/* arXiv + Stocks below the feed */}
            <ArxivSection />
            <StocksSection />
          </div>

          <div className="xl:col-span-5">
            <div className="xl:sticky xl:top-16 flex flex-col gap-4">
              <ExecutiveBriefSection />
              <TrendsSection />
              <SentimentSection />
              <ComputeStatusSection />
              <TrendsInsightsSection />
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="mt-6 border-t border-slate-200 bg-white">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">AI Canada Pulse Platform</p>
              <p>v3.0 — Dynamic AI Data Architecture</p>
              <p className="mt-1">
                Contact:{" "}
                <a href="mailto:scott.hazlitt@gmail.com" className="text-indigo-700 hover:underline">
                  scott.hazlitt@gmail.com
                </a>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-medium text-slate-600">Data Connections:</span>
              <div className="h-3 w-px bg-slate-300 hidden sm:block"></div>
              <span>Stats Canada</span>
              <span>Google Trends</span>
              <span>Yahoo Finance</span>
              <span>arXiv</span>
              <span className="text-slate-300">•</span>
              <Link href="/insights" className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
                Deep Insights →
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/methodology" className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
                View all sources →
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
            <p>
              <strong className="text-slate-500">AI Disclaimer:</strong> This platform uses artificial intelligence models to generate article summaries, executive briefs, and sentiment analysis. AI-generated content is marked with a ✦ symbol and should not be treated as authoritative analysis. Market data is delayed and should not be used for trading decisions. Always verify critical information with primary sources.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
