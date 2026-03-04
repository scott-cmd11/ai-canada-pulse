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
import LabFeedsSection from "@/components/LabFeedsSection"
import HuggingFaceSection from "@/components/HuggingFaceSection"
import JobMarketSection from "@/components/JobMarketSection"
import AIAdoptionSection from "@/components/AIAdoptionSection"
import SectionNav from "@/components/SectionNav"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col gap-4">

        <HeroBanner />

        {/* ── Section Navigation ── */}
        <SectionNav />

        {/* ── Full-width Briefing ── */}
        <div id="briefing">
          <div className="section-header">
            <h2>Top Briefing</h2>
          </div>
          <BriefingCard />
        </div>

        {/* ── Full-width Intelligence Brief ── */}
        <ExecutiveBriefSection />

        {/* ── ROW 1: Latest Developments | Sidebar (Adoption + Sentiment + Compute + Regional) ── */}
        <div id="news" className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-start">

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
          </div>

          <div className="xl:col-span-5">
            <div className="xl:sticky xl:top-16 flex flex-col gap-4">
              <SentimentSection />
              <TrendsSection />
              <TrendsInsightsSection />
            </div>
          </div>

        </div>

        {/* ── ROW 2: Economic Context (Full Width) ── */}
        <div id="economy">
          <IndicatorsSection />
        </div>

        {/* ── ROW 3: Research + Markets ── */}
        <div id="research" className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <ArxivSection />
          <StocksSection />
        </div>

        {/* ── ROW 4: Lab Feeds ── */}
        <LabFeedsSection />

        {/* ── ROW 5: Compute Infrastructure ── */}
        <div id="infra">
          <ComputeStatusSection />
        </div>

        {/* ── ROW 6: Market & Adoption ── */}
        <div id="jobs" className="flex flex-col gap-4">
          <JobMarketSection />
          <AIAdoptionSection />
        </div>

        {/* ── ROW 7: Canadian AI Models ── */}
        <div id="models">
          <HuggingFaceSection />
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
                {" · "}
                <a href="https://www.linkedin.com/in/scott-hazlitt/" target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">
                  LinkedIn
                </a>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-medium text-slate-600">Data Connections:</span>
              <div className="h-3 w-px bg-slate-300 hidden sm:block"></div>
              <span>Stats Canada</span>
              <span>Google Trends</span>
              <span>Yahoo Finance</span>
              <span>OpenAlex</span>
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
            <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="font-semibold text-slate-500">Built with</span>
              <a href="https://docs.anthropic.com/en/docs/claude-code" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Claude Code</a>
              <span>·</span>
              <a href="https://github.com/google-gemini/gemini-cli" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Gemini CLI</a>
              <span>·</span>
              <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Next.js</a>
              <span>·</span>
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Vercel</a>
              <span>·</span>
              <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Tailwind CSS</a>
              <span>·</span>
              <a href="https://echarts.apache.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">ECharts</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
