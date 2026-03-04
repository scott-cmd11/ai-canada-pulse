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
import EpochAISection from "@/components/EpochAISection"
import JobMarketSection from "@/components/JobMarketSection"
import AIAdoptionSection from "@/components/AIAdoptionSection"
import SectionNav from "@/components/SectionNav"
import ScrollToTop from "@/components/ScrollToTop"
import ScrollReveal from "@/components/ScrollReveal"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col gap-4">

        <HeroBanner />

        {/* ── Section Navigation ── */}
        <SectionNav />

        {/* ═══════════════════════════════════════════════════════ */}
        {/* GROUP 1: Intelligence                                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <div id="intelligence" className="border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-lg">📋</span>
              <h2 className="text-lg font-bold text-slate-900">Intelligence</h2>
            </div>

            <div className="flex flex-col gap-4">
              {/* Briefing + Executive Brief */}
              <BriefingCard />
              <ExecutiveBriefSection />

              {/* News Feed */}
              <div>
                <StoryFeed />
              </div>

              {/* Sentiment (derived from news feed) */}
              <SentimentSection />
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* GROUP 2: Markets & Economy                             */}
        {/* ═══════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <div id="markets" className="border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-lg">📈</span>
              <h2 className="text-lg font-bold text-slate-900">Markets &amp; Economy</h2>
            </div>

            <div className="flex flex-col gap-4">
              {/* Stocks */}
              <StocksSection />

              {/* Economic Indicators */}
              <IndicatorsSection />

              {/* Jobs + AI Adoption */}
              <JobMarketSection />
              <AIAdoptionSection />
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* GROUP 3: Research & Innovation                         */}
        {/* ═══════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <div id="research" className="border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-lg">🔬</span>
              <h2 className="text-lg font-bold text-slate-900">Research &amp; Innovation</h2>
            </div>

            <div className="flex flex-col gap-4">
              {/* Epoch AI — AI Progress Tracker */}
              <EpochAISection />

              {/* ArXiv + HuggingFace side by side */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                <ArxivSection />
                <HuggingFaceSection />
              </div>

              {/* Lab Feeds */}
              <LabFeedsSection />
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* GROUP 4: Trends & Infrastructure                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <div id="landscape" className="border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-lg">🌐</span>
              <h2 className="text-lg font-bold text-slate-900">Trends &amp; Infrastructure</h2>
            </div>

            <div className="flex flex-col gap-4">
              {/* Google Trends + Provincial breakdown */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                <TrendsSection />
                <TrendsInsightsSection />
              </div>

              {/* Compute Infrastructure */}
              <ComputeStatusSection />
            </div>
          </div>
        </ScrollReveal>

      </main>

      {/* Footer */}
      <footer className="mt-6 border-t border-slate-200 bg-white">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">AI Canada Pulse Platform</p>
              <p>v3.0 · Dynamic AI Data Architecture · <span className="text-amber-600 font-semibold">🚧 Work in Progress</span></p>
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
              <p className="mt-1 text-xs text-slate-400 italic">
                This is a personal project created on personal time and resources. It does not represent the views of, and is not affiliated with, the Government of Canada or any government department.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-medium text-slate-600">Data Connections:</span>
              <div className="h-3 w-px bg-slate-300 hidden sm:block"></div>
              <span>Stats Canada</span>
              <span>Google Trends</span>
              <span>Yahoo Finance</span>
              <span>OpenAlex</span>
              <span>Epoch AI</span>
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

      <ScrollToTop />
    </div>
  )
}
