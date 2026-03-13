import Header from "@/components/Header"
import Link from "next/link"
import ScrollToTop from "@/components/ScrollToTop"

const methodologyBands = [
  {
    eyebrow: "Frontier benchmark",
    title: "Capability trend reference",
    type: "Live fetched data",
    refresh: "Fetched on demand from the METR / Epoch route",
    summary:
      "The dashboard hero pairs Canada-focused monitoring with a frontier model capability benchmark. It is used as context for the pace of the global race rather than as a Canada metric.",
    sources: [
      { label: "METR / Epoch model capability data", href: "https://epoch.ai" },
    ],
  },
  {
    eyebrow: "Canada signal layer",
    title: "Stories, lead signal, brief, and sentiment",
    type: "Mixed: live fetched data, derived heuristics, AI-generated summaries",
    refresh: "Stories route cached for 30 minutes; sentiment route polled every 2 minutes in the UI",
    summary:
      "Canada stories are aggregated from Google News RSS, BetaKit RSS, and CBC Technology RSS, deduplicated by normalized headline, filtered for AI relevance, sorted by recency, and capped to the current visible dashboard story limit of 20. The most recent story becomes the lead signal. Sentiment is derived from keyword-based headline classification across the same story set.",
    bullets: [
      "The executive brief and per-article summaries are attached from cached enrichment, not generated during normal page requests.",
      "The curated Canada feed on /dashboard reads the same cached story route and hides the lead story from the downstream feed list.",
      "Pulse mood is derived from the current story sentiment distribution rather than a separate external sentiment service.",
    ],
    sources: [
      { label: "Google News RSS", href: "https://news.google.com/rss" },
      { label: "BetaKit RSS", href: "https://betakit.com/feed/" },
      { label: "CBC Technology RSS", href: "https://www.cbc.ca/webfeed/rss/rss-technology" },
    ],
  },
  {
    eyebrow: "Global context layer",
    title: "Compact benchmark band for global AI pace",
    type: "Live fetched data + AI-generated brief",
    refresh: "Global news API cached for 15 minutes with stale-while-revalidate fallback",
    summary:
      "The dashboard keeps Canada as the primary lens, but the global context band pulls from the global news route to show the frontier capability, policy, and model moves shaping Canadian urgency. Only a compact slice of this broader global context appears on /dashboard.",
    bullets: [
      "The band displays a short cached global brief plus a source mix from the current global story set.",
      "The broader world coverage lives off-dashboard; /dashboard only uses this compact context layer.",
    ],
    sources: [
      { label: "Global AI news route", href: "/insights" },
    ],
  },
  {
    eyebrow: "Canada capacity layer",
    title: "Adoption, regional interest, compute, and research infrastructure",
    type: "Mixed: live fetched data + curated static references",
    refresh: "Trends fetched on demand; regional trends every 6 hours; compute status every 5 minutes; lab links curated",
    summary:
      "This layer is designed to answer whether Canada is building practical AI capacity rather than just generating headlines. It combines public interest signals, national compute status, and links to the country?s flagship lab ecosystems.",
    bullets: [
      "AI tool adoption uses Google Trends data for tools tracked on the dashboard, with fallback data if live fetch fails.",
      "Regional interest compares provinces using normalized Google Trends relative-interest values.",
      "Compute infrastructure reflects Digital Research Alliance of Canada status data for national research clusters.",
      "Lab updates are curated outbound links to Mila, Vector, CIFAR, and Amii publication or research pages.",
    ],
    sources: [
      { label: "Google Trends", href: "https://trends.google.com" },
      { label: "Digital Research Alliance of Canada status", href: "https://status.alliancecan.ca" },
      { label: "Mila publications", href: "https://mila.quebec/en/publications" },
      { label: "Vector Institute research", href: "https://vectorinstitute.ai/research/publications/" },
      { label: "CIFAR AI publications", href: "https://cifar.ca/ai-society-publications/" },
      { label: "Amii research", href: "https://www.amii.ca/research/" },
    ],
  },
  {
    eyebrow: "Market and policy impact",
    title: "Stocks and macroeconomic indicators",
    type: "Live fetched data",
    refresh: "Stocks cached for 30 minutes; indicators fetched live with graceful fallback",
    summary:
      "The bottom dashboard band focuses on where AI acceleration is already visible in Canadian public-market exposure and macroeconomic context. These modules are supporting indicators, not trading or forecasting tools.",
    bullets: [
      "Stocks track a curated basket of Canadian AI and technology names via the stock route and delayed market data inputs.",
      "Economic indicators come from Statistics Canada series used to provide labour, inflation, and output context around Canadian AI activity.",
    ],
    sources: [
      { label: "Statistics Canada data", href: "https://www150.statcan.gc.ca/n1/en/type/data" },
      { label: "Yahoo Finance", href: "https://finance.yahoo.com" },
    ],
  },
]

const pipelineCards = [
  {
    title: "What is live fetched",
    text:
      "RSS stories, global news, stocks, indicators, Google Trends inputs, and compute status are fetched from public sources or source routes at the cadences implemented in the app. These are the raw or near-raw inputs the dashboard builds on.",
  },
  {
    title: "What is derived",
    text:
      "Topic/category tags, regional labels, pulse mood, and sentiment are derived inside the application from the fetched story set using deterministic heuristics and classification rules. They are not model-generated opinions.",
  },
  {
    title: "What is AI-generated",
    text:
      "Per-article summaries and the Canada/global executive briefs are generated with OpenAI models. Article summaries use gpt-5-nano. Executive and global briefs use gpt-5-mini.",
  },
  {
    title: "What is curated",
    text:
      "The lab infrastructure section uses maintained outbound references rather than scraped live feeds. These links are included to point users toward flagship Canadian AI institutions, not to mirror their full publication output.",
  },
]

const limits = [
  "AI summaries are produced from headlines and short context snippets. They can miss nuance, omit background, or flatten uncertainty. They should be treated as navigation aids, not authoritative analysis.",
  "Public feeds can change structure, publish duplicates, or omit context. The app deduplicates and filters aggressively, but false positives and missed stories remain possible.",
  "Market and macro indicators are contextual signals only. They are not investment advice, economic forecasts, or causal evidence about AI effects.",
  "Some secondary or legacy endpoints still exist in the codebase, but this page documents the current live /dashboard experience only.",
]

const cadenceRows = [
  { label: "Canada story aggregation", value: "Server cache revalidates every 30 minutes" },
  { label: "Global context news route", value: "15-minute cache with stale-while-revalidate fallback" },
  { label: "Compute status", value: "5-minute revalidation" },
  { label: "Regional trends", value: "6-hour revalidation" },
  { label: "Stocks route", value: "30-minute cache" },
  { label: "AI enrichment refresh", value: "Scheduled every 6 hours via GitHub Actions, plus a once-daily Vercel cron trigger" },
]

function SectionCard({
  eyebrow,
  title,
  type,
  refresh,
  summary,
  bullets,
  sources,
}: {
  eyebrow: string
  title: string
  type: string
  refresh: string
  summary: string
  bullets?: string[]
  sources?: { label: string; href: string }[]
}) {
  return (
    <section className="saas-card bg-white p-6 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{title}</h2>
        </div>
        <div className="flex flex-col gap-2 text-left sm:max-w-xs sm:text-right">
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
            {type}
          </span>
          <span className="text-xs font-medium text-slate-500">{refresh}</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-600">{summary}</p>

      {bullets && bullets.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {sources && sources.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {sources.map((source) => {
            const internal = source.href.startsWith("/")
            const classes =
              "rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"

            return internal ? (
              <Link key={source.label} href={source.href} className={classes}>
                {source.label}
              </Link>
            ) : (
              <a key={source.label} href={source.href} target="_blank" rel="noopener noreferrer" className={classes}>
                {source.label}
              </a>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
            ? Back to Dashboard
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.06),_transparent_35%)]" />
          <div className="relative z-10 max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Trust and methodology</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How the live Canada dashboard is built
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
              AI Canada Pulse is a Canada-first monitoring product for the AI acceleration race. The live dashboard blends public data feeds, deterministic classification, cached AI-generated summaries, and curated institutional references. This page documents the current product as it exists today, not older dashboard versions or secondary legacy modules.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Automated</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">Story aggregation, global context, trends, compute, indicators, stocks, sentiment derivation, and cached AI summaries/briefs.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Curated</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">Canadian lab references and the overall dashboard composition that determines what signals are emphasized.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delayed / cached</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">AI enrichment, some route responses, and market data are intentionally cached to keep costs low and the public experience stable.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Current dashboard bands</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">What each live section is actually using</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              The methodology below mirrors the current /dashboard structure: frontier benchmark, Canada signals, global context, capacity evidence, and market or macro impact.
            </p>
          </div>

          <div className="space-y-5">
            {methodologyBands.map((band) => (
              <SectionCard key={band.title} {...band} />
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="saas-card bg-white p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">AI generation and caching</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">How summaries are produced now</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              The live product no longer generates summaries on normal user requests. Instead, AI enrichment is precomputed on a schedule and attached from cache when the public story routes are served.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {pipelineCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-relaxed text-slate-700">
              <p>
                Canada article summaries target all dashboard-visible Canada stories up to the current feed cap of <strong>20</strong>. Article summaries use <strong>gpt-5-nano</strong>. Canada and global executive briefs use <strong>gpt-5-mini</strong>.
              </p>
              <p className="mt-3">
                Persistent enrichment storage uses <strong>Vercel KV</strong> when configured, falls back to <strong>Redis via REDIS_URL</strong> when available, and uses an in-memory fallback in local or degraded environments.
              </p>
            </div>
          </div>

          <div className="saas-card bg-white p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Cadence and reliability</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Refresh behavior in the current app</h2>
            <div className="mt-5 space-y-3">
              {cadenceRows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="saas-card bg-white p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Data quality and limits</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">What this dashboard is good for, and what it is not</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              {limits.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="saas-card bg-white p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Current scope</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">What this page intentionally does not cover</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              This methodology page is scoped to the current live Canada dashboard and its compact global context band. It does not attempt to document every internal route, older dashboard experiments, or secondary data modules that are present in the repository but not part of the primary user experience.
            </p>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
              <p>
                If a source or module is not visibly shaping today?s <Link href="/dashboard" className="font-semibold text-indigo-700 hover:underline">dashboard</Link>, it is not treated here as a core live product input.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-100 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Disclaimer</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            AI Canada Pulse is an informational monitoring product. It does not provide financial, legal, regulatory, or policy advice. AI-generated summaries and briefs are generated from public-source headlines and short context snippets and may contain omissions or phrasing errors. Market data may be delayed. Always verify important claims with primary sources.
          </p>
        </div>
      </main>

      <ScrollToTop />
    </div>
  )
}
