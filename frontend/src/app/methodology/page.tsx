import Header from "@/components/Header"
import Link from "next/link"

const dataSources = [
    {
        section: "News & Top Briefing",
        source: "Google News RSS, BetaKit RSS, CBC Technology RSS",
        refresh: "Every 5 minutes",
        details: "Stories are aggregated from Canadian tech and policy RSS feeds, deduplicated by headline similarity, and categorized by topic. The top story is selected based on recency and relevance.",
        url: "https://news.google.com/rss",
    },
    {
        section: "AI Intelligence Brief",
        source: "HuggingFace Inference API (Qwen 2.5-7B)",
        refresh: "Every 5 minutes (with story cache)",
        details: "AI-generated thematic analysis is produced by sending current headline data to a large language model. The brief identifies patterns and trends across all current stories. Individual article summaries are also AI-generated.",
        url: "https://huggingface.co",
    },
    {
        section: "Economic Context",
        source: "Statistics Canada, Web Data Service (WDS) API",
        refresh: "Daily (monthly data release)",
        details: "Six economic indicators are sourced live from Statistics Canada: unemployment rate, youth unemployment (15-24), labour force participation, employment rate, CPI, and GDP (all industries). All data goes back to January 2022, providing context for how AI adoption correlates with macroeconomic conditions.",
        url: "https://www150.statcan.gc.ca/n1/en/type/data",
    },
    {
        section: "AI Tool Adoption Curve",
        source: "Google Trends (via google-trends-api)",
        refresh: "Every 6 hours",
        details: "Tracks relative search interest for specific AI products — ChatGPT, GitHub Copilot, Midjourney, and Claude AI — in Canada from January 2022 to present. The chart shows the inflection point when ChatGPT launched in November 2022 and the adoption trajectory of competing tools.",
        url: "https://trends.google.com",
    },
    {
        section: "AI Search Interest by Province",
        source: "Google Trends (regional breakdown)",
        refresh: "Every 6 hours",
        details: "Shows relative AI search interest across Canada's 10 provinces. Territories are excluded due to small populations producing unreliable relative scores. Values represent a relative volume index (0–100) normalized to the province with the highest interest.",
        url: "https://trends.google.com",
    },
    {
        section: "Media Sentiment",
        source: "Derived from RSS news feed",
        refresh: "Every 30 minutes",
        details: "Sentiment is computed by analyzing the tone of current news headlines using keyword-based classification. Each story is scored as positive, neutral, or concerning and aggregated into an overall sentiment score.",
    },
    {
        section: "Market Performance",
        source: "Yahoo Finance",
        refresh: "Every 30 minutes",
        details: "Tracks 8 TSX-listed Canadian AI and technology companies: Shopify (SHOP), Kinaxis (KXS), Coveo Solutions (CVO), OpenText (OTEX), CGI Group (GIB-A), BlackBerry (BB), Docebo (DCBO), and Lightspeed Commerce (LSPD). Prices reflect the most recent trading session.",
        url: "https://finance.yahoo.com",
    },
    {
        section: "arXiv Preprints",
        source: "arXiv API",
        refresh: "Every 6 hours",
        details: "Queries the arXiv preprint server for recent AI and machine learning papers with Canadian institutional affiliations. Shows the latest preprints in categories including cs.AI, cs.LG, cs.CL, and cs.CV.",
        url: "https://arxiv.org",
    },
    {
        section: "Compute Status",
        source: "Derived from arXiv metadata",
        refresh: "Every 6 hours",
        details: "Analyzes Canadian AI preprints to estimate research compute trends, including the distribution of research topics and the volume of submissions over time.",
    },
]

export default function MethodologyPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Header />

            <main className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

                <div className="mb-8">
                    <Link href="/dashboard" className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Data Sources & Methodology
                </h1>
                <p className="text-base text-slate-600 leading-relaxed mb-10 max-w-[700px]">
                    AI Canada Pulse aggregates data from multiple public sources to provide a comprehensive view of
                    artificial intelligence developments across Canada. This page documents every data source,
                    its refresh cadence, and how it is used on the dashboard.
                </p>

                <div className="flex flex-col gap-6">
                    {dataSources.map((ds) => (
                        <section key={ds.section} className="saas-card bg-white p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                <h2 className="text-lg font-bold text-slate-900">{ds.section}</h2>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full self-start whitespace-nowrap">
                                    {ds.refresh}
                                </span>
                            </div>

                            <p className="text-sm font-semibold text-slate-700 mb-2">
                                {ds.source}
                            </p>

                            <p className="text-sm text-slate-600 leading-relaxed">
                                {ds.details}
                            </p>

                            {ds.url && (
                                <a
                                    href={ds.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-3 text-xs font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
                                >
                                    Visit source →
                                </a>
                            )}
                        </section>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-slate-100 rounded-lg border border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Disclaimer</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        AI Canada Pulse is an informational tool and does not constitute financial, legal, or policy advice.
                        Data is aggregated from publicly available sources and may contain inaccuracies, delays, or gaps.
                        AI-generated summaries are produced by large language models and should not be treated as authoritative analysis.
                        Market data is delayed and should not be used for trading decisions. Always verify information with primary sources.
                    </p>
                </div>

            </main>
        </div>
    )
}
