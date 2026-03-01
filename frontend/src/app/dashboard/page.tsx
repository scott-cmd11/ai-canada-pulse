import Link from "next/link"
import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"
import BriefingCard from "@/components/BriefingCard"
import ExecutiveBriefSection from "@/components/ExecutiveBriefSection"
import IndicatorsSection from "@/components/IndicatorsSection"
import TrendsSection from "@/components/TrendsSection"
import StoryFeed from "@/components/StoryFeed"
import ResearchSection from "@/components/ResearchSection"
import SentimentSection from "@/components/SentimentSection"
import StocksSection from "@/components/StocksSection"
import OpenSourceSection from "@/components/OpenSourceSection"
import ArxivSection from "@/components/ArxivSection"
import OecdSection from "@/components/OecdSection"
import AIAdoptionSection from "@/components/AIAdoptionSection"
import ComputeStatusSection from "@/components/ComputeStatusSection"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      {/* Fluid layout with tight padding, high density */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-8">

        {/* Full width functional summary */}
        <div>
          <HeroSection />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">

          {/* LEFT COLUMN: Narrative & Policy (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-10">

            <div>
              <div className="section-header">
                <h2>Top Briefing</h2>
              </div>
              <BriefingCard />
            </div>

            {/* AI Executive Brief — appears when HF_API_TOKEN is configured */}
            <ExecutiveBriefSection />

            <div>
              <div className="section-header flex items-center justify-between">
                <h2>Latest Developments</h2>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  REAL-TIME
                </span>
              </div>
              <StoryFeed />
            </div>

            <div>
              <ResearchSection />
            </div>

            <div>
              <ArxivSection />
            </div>

          </div>

          {/* RIGHT COLUMN: Data & Markets (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-10">

            <div>
              <StocksSection />
            </div>

            <div>
              <IndicatorsSection />
            </div>

            <div>
              <TrendsSection />
            </div>

            <div>
              <SentimentSection />
            </div>

            <div>
              <ComputeStatusSection />
            </div>

          </div>

        </div>

        {/* Full-width sections below the two-column layout */}
        <div className="flex flex-col gap-10">

          <div>
            <OpenSourceSection />
          </div>

          <div>
            <OecdSection />
          </div>

          <div>
            <AIAdoptionSection />
          </div>

        </div>

      </main>

      {/* Functional SaaS Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
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
              <span>OpenAlex</span>
              <span>Yahoo Finance</span>
              <span>Hugging Face</span>
              <span>GitHub</span>
              <span>arXiv</span>
              <span>OECD</span>
              <span>Alliance Canada</span>
              <span className="text-slate-300">•</span>
              <Link href="/methodology" className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
                View all sources →
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
            <p>
              <strong className="text-slate-500">AI Disclaimer:</strong> This platform uses artificial intelligence models to generate article summaries, executive briefs, and sentiment analysis. AI-generated content is marked with a ✦ symbol and should not be treated as authoritative analysis. Market data is delayed and should not be used for trading decisions. Some datasets use research-based estimates from public reports rather than live feeds. Always verify critical information with primary sources.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
