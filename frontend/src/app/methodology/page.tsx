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
        section: "Market Performance",
        source: "Yahoo Finance",
        refresh: "Every 30 minutes",
        details: "Tracks 8 TSX-listed Canadian AI and technology companies: Shopify (SHOP), Kinaxis (KXS), Coveo Solutions (CVO), OpenText (OTEX), CGI Group (GIB-A), BlackBerry (BB), Docebo (DCBO), and Lightspeed Commerce (LSPD). Prices reflect the most recent trading session.",
        url: "https://finance.yahoo.com",
    },
    {
        section: "Economic Context",
        source: "Statistics Canada, Web Data Service (WDS) API",
        refresh: "Daily (monthly data release)",
        details: "Unemployment rate, youth unemployment, labour force participation, and employment rate are sourced from the Labour Force Survey (Table 14-10-0287-01). Data reflects the most recent monthly release from Statistics Canada.",
        url: "https://www150.statcan.gc.ca/n1/en/type/data",
    },
    {
        section: "Google Trends",
        source: "Google Trends (via google-trends-api)",
        refresh: "Every 6 hours",
        details: "Tracks relative search interest for AI-related terms in Canada over the trailing 12 months. Values represent a relative volume index (0–100), not absolute search counts.",
        url: "https://trends.google.com",
    },
    {
        section: "Media Sentiment",
        source: "Derived from RSS news feed",
        refresh: "Every 30 minutes",
        details: "Sentiment is computed by analyzing the tone of current news headlines using keyword-based classification. Each story is scored as positive, neutral, or concerning and aggregated into an overall sentiment score.",
    },
    {
        section: "Research Output",
        source: "OpenAlex API",
        refresh: "Every 6 hours",
        details: "Queries the OpenAlex scholarly database for recent, high-citation AI research papers authored by Canadian institutions. Filtered by concept (artificial intelligence) and geographic affiliation.",
        url: "https://openalex.org",
    },
    {
        section: "AI Adoption Rates",
        source: "Statistics Canada (11-621-M), Treasury Board of Canada",
        refresh: "Manual / Quarterly",
        details: "Public and private sector AI adoption rates are sourced from Statistics Canada's survey of digital technology adoption and the Treasury Board's reporting on federal government AI use. Industry breakdown is based on the latest available survey data.",
        url: "https://www150.statcan.gc.ca",
    },
    {
        section: "Labour Demand",
        source: "ISED Canada, CIFAR, Statistics Canada (estimates)",
        refresh: "Manual / Quarterly",
        details: "Job market data is estimated from public reports by Innovation, Science and Economic Development Canada (ISED), CIFAR, and Statistics Canada. These are research-based estimates, not live job postings. A disclaimer is displayed when estimated data is shown.",
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
