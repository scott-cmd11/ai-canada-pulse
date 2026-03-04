import Link from "next/link"
import Header from "@/components/Header"
import ScrollReveal from "@/components/ScrollReveal"
import ScrollToTop from "@/components/ScrollToTop"
import GlobalNewsSection from "@/components/GlobalNewsSection"
import GlobalBriefSection from "@/components/GlobalBriefSection"
import GlobalTrendsSection from "@/components/GlobalTrendsSection"
import GlobalResearchSection from "@/components/GlobalResearchSection"
import PolicyLandscapeSection from "@/components/PolicyLandscapeSection"

export default function GlobalInsightsPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Header />

            <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6">

                {/* Page Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-8 sm:px-12 py-10 sm:py-12">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-500/15 rounded-full blur-[80px]" />
                    <div className="absolute right-8 bottom-4 opacity-[0.04] text-[180px] leading-none pointer-events-none select-none">
                        🌍
                    </div>

                    <div className="relative z-10">
                        <Link href="/dashboard" className="text-sm font-medium text-emerald-300 hover:text-white hover:underline">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-4">
                            Global AI Landscape
                        </h1>
                        <p className="text-base sm:text-lg text-emerald-200/70 leading-relaxed max-w-xl mt-2">
                            How Canada compares to the world in AI research, adoption, and policy.
                        </p>
                    </div>
                </div>

                {/* Section 1: International News */}
                <ScrollReveal>
                    <div className="border-t border-slate-200 pt-5">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="text-lg">🌍</span>
                            <h2 className="text-lg font-bold text-slate-900">International AI News</h2>
                        </div>
                        <GlobalBriefSection />
                        <GlobalNewsSection />
                    </div>
                </ScrollReveal>

                {/* Section 2: Global Interest + Research side by side */}
                <ScrollReveal>
                    <div className="border-t border-slate-200 pt-5">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="text-lg">📊</span>
                            <h2 className="text-lg font-bold text-slate-900">Global Comparisons</h2>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                            <GlobalTrendsSection />
                            <GlobalResearchSection />
                        </div>
                    </div>
                </ScrollReveal>

                {/* Section 3: Policy Landscape */}
                <ScrollReveal>
                    <div className="border-t border-slate-200 pt-5">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="text-lg">⚖️</span>
                            <h2 className="text-lg font-bold text-slate-900">Regulatory Landscape</h2>
                        </div>
                        <PolicyLandscapeSection />
                    </div>
                </ScrollReveal>

            </main>

            {/* Footer */}
            <footer className="mt-12 border-t border-slate-200 bg-white">
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <div>
                            <p className="font-semibold text-slate-700">AI Canada Pulse Platform</p>
                            <p>v3.0 · Global AI Landscape</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="font-semibold text-indigo-700 hover:underline">
                                ← Dashboard
                            </Link>
                            <Link href="/methodology" className="font-semibold text-indigo-700 hover:underline">
                                Methodology
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>

            <ScrollToTop />
        </div>
    )
}
