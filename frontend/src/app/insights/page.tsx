import Link from "next/link"
import Header from "@/components/Header"
import GovRegistrySection from "@/components/GovRegistrySection"
import ParliamentSection from "@/components/ParliamentSection"
import JobMarketSection from "@/components/JobMarketSection"
import OpenSourceSection from "@/components/OpenSourceSection"
import HuggingFaceSection from "@/components/HuggingFaceSection"
import ResearchSection from "@/components/ResearchSection"
import AIAdoptionSection from "@/components/AIAdoptionSection"
import TrendsInsightsSection from "@/components/TrendsInsightsSection"

export default function InsightsPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Header />

            <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-8">

                {/* Page Header */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Deep Insights
                    </h1>
                    <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
                        Extended intelligence covering government policy, parliamentary discourse, labour markets,
                        open-source activity, academic research, and AI adoption across Canada. All data is fetched
                        live from authoritative public sources.
                    </p>
                </div>

                {/* ── Section 1: Government & Policy ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    <GovRegistrySection />
                    <ParliamentSection />
                </div>

                {/* ── Section 2: Labour & Economy ── */}
                <JobMarketSection />

                {/* ── Section 3: Research & Innovation ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    <ResearchSection />
                    <AIAdoptionSection />
                </div>

                {/* ── Section 4: Open Source & Models ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    <OpenSourceSection />
                    <HuggingFaceSection />
                </div>

                {/* ── Section 5: Regional Interest ── */}
                <TrendsInsightsSection />

            </main>

            {/* Footer */}
            <footer className="mt-12 border-t border-slate-200 bg-white">
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <div>
                            <p className="font-semibold text-slate-700">AI Canada Pulse Platform</p>
                            <p>v3.0 — Deep Insights</p>
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
                            <span>Open Canada</span>
                            <span>OpenParliament</span>
                            <span>Indeed</span>
                            <span>GitHub</span>
                            <span>Hugging Face</span>
                            <span>OpenAlex</span>
                            <span>Google Trends</span>
                            <span className="text-slate-300">•</span>
                            <Link href="/dashboard" className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
                                ← Back to Dashboard
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
