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

            <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6">

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

                {/* ═══════════════════════════════════════════════ */}
                {/* SECTION 1: Innovation Pipeline                 */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-lg">🔬</span>
                        <h2 className="text-lg font-bold text-slate-900">Innovation Pipeline</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-5">What&apos;s being researched and built across Canadian institutions and the open-source community.</p>

                    <div className="flex flex-col gap-6">
                        <ResearchSection />
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <OpenSourceSection />
                            <HuggingFaceSection />
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* SECTION 2: Market & Adoption                   */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-lg">📊</span>
                        <h2 className="text-lg font-bold text-slate-900">Market &amp; Adoption</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-5">Where AI talent is in demand and which industries are adopting it fastest.</p>

                    <div className="flex flex-col gap-6">
                        <JobMarketSection />
                        <AIAdoptionSection />
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* SECTION 3: Regional Landscape                  */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-lg">🗺️</span>
                        <h2 className="text-lg font-bold text-slate-900">Regional Landscape</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-5">How AI interest and search activity vary across Canadian provinces.</p>

                    <TrendsInsightsSection />
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* SECTION 4: Policy & Governance                 */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-lg">🏛️</span>
                        <h2 className="text-lg font-bold text-slate-900">Policy &amp; Governance</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-5">How the federal government is deploying and regulating AI systems.</p>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <GovRegistrySection />
                        <ParliamentSection />
                    </div>
                </div>

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
