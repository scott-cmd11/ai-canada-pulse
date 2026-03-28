import Header from "@/components/Header"
import Link from "next/link"
import ScrollToTop from "@/components/ScrollToTop"
import { SOURCES, getSourcesByType } from "@/lib/source-registry"

const TYPE_LABELS: Record<string, string> = {
  news: "News Sources",
  research: "Research",
  government: "Government",
  jobs: "Jobs",
  market: "Market Data",
  trends: "Trends",
  registry: "Registries",
}

const SOURCE_TYPES = ["news", "research", "government", "jobs", "market", "trends", "registry"] as const

const limits = [
  "AI summaries are produced from headlines and short context snippets. They can miss nuance, omit background, or flatten uncertainty. They should be treated as navigation aids, not authoritative analysis.",
  "Public feeds can change structure, publish duplicates, or omit context. The app deduplicates and filters aggressively, but false positives and missed stories remain possible.",
  "Market and macro indicators are contextual signals only. They are not investment advice, economic forecasts, or causal evidence about AI effects.",
  "Some secondary or legacy endpoints still exist in the codebase, but this page documents the current live /dashboard experience only.",
]

const FETCH_METHOD_LABELS: Record<string, string> = {
  rss: "RSS",
  api: "API",
  scrape: "Scrape",
  manual: "Manual",
}

const SCOPE_LABELS: Record<string, string> = {
  national: "National",
  provincial: "Provincial",
  both: "National + Provincial",
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <Header />

      <main className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-3xl px-6 py-8 shadow-sm sm:px-8 sm:py-10"
          style={{
            backgroundColor: "var(--surface-primary)",
            borderColor: "var(--border-subtle)",
            borderWidth: "1px",
            borderStyle: "solid",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.06),_transparent_35%)]" />
          <div className="relative z-10 max-w-4xl">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--accent-primary)" }}
            >
              Trust and methodology
            </p>
            <h1
              className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: "var(--text-primary)" }}
            >
              Methodology
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-secondary)" }}>
              AI Canada Pulse is a Canada-first monitoring product focused on domestic AI signals. The live dashboard
              blends public data feeds, deterministic classification, cached AI-generated summaries, and curated
              institutional references. This page documents every data source and how AI processing works.
            </p>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mt-10" id="data-sources">
          <div className="mb-6">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--text-muted)" }}
            >
              {SOURCES.length} active sources
            </p>
            <h2 className="mt-1 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Data Sources
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              All sources tracked by the platform, grouped by type. Refresh intervals are server-side cache
              revalidation times.
            </p>
          </div>

          <div className="space-y-8">
            {SOURCE_TYPES.map((type) => {
              const sources = getSourcesByType(type)
              if (sources.length === 0) return null
              return (
                <div key={type}>
                  <h3
                    className="mb-3 text-sm font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {TYPE_LABELS[type]}
                  </h3>
                  <div
                    className="overflow-hidden rounded-2xl"
                    style={{
                      borderColor: "var(--border-subtle)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                  >
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          style={{
                            backgroundColor: "var(--surface-secondary)",
                            borderBottomColor: "var(--border-subtle)",
                            borderBottomWidth: "1px",
                            borderBottomStyle: "solid",
                          }}
                        >
                          <th
                            className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Source
                          </th>
                          <th
                            className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider sm:table-cell"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Description
                          </th>
                          <th
                            className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider md:table-cell"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Refresh
                          </th>
                          <th
                            className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider lg:table-cell"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Scope
                          </th>
                          <th
                            className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider lg:table-cell"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Method
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.map((source, idx) => (
                          <tr
                            key={source.id}
                            style={{
                              backgroundColor: "var(--surface-primary)",
                              borderTopColor: idx > 0 ? "var(--border-subtle)" : "transparent",
                              borderTopWidth: idx > 0 ? "1px" : "0",
                              borderTopStyle: "solid",
                            }}
                          >
                            <td className="px-4 py-3 align-top">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold hover:underline"
                                style={{ color: "var(--accent-primary)" }}
                              >
                                {source.name}
                              </a>
                              <p
                                className="mt-1 text-xs leading-relaxed sm:hidden"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {source.description}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
                                    color: "var(--accent-primary)",
                                  }}
                                >
                                  {source.refreshInterval}
                                </span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: "var(--surface-secondary)",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {FETCH_METHOD_LABELS[source.fetchMethod]}
                                </span>
                              </div>
                            </td>
                            <td
                              className="hidden px-4 py-3 align-top text-xs leading-relaxed sm:table-cell"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {source.description}
                            </td>
                            <td className="hidden px-4 py-3 align-top md:table-cell">
                              <span
                                className="rounded-full px-2 py-1 text-[11px] font-semibold"
                                style={{
                                  backgroundColor: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
                                  color: "var(--accent-primary)",
                                }}
                              >
                                {source.refreshInterval}
                              </span>
                            </td>
                            <td
                              className="hidden px-4 py-3 align-top text-xs lg:table-cell"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {SCOPE_LABELS[source.dataScope]}
                            </td>
                            <td
                              className="hidden px-4 py-3 align-top text-xs lg:table-cell"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {FETCH_METHOD_LABELS[source.fetchMethod]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Manually Curated Data */}
        <section className="mt-10" id="curated-data">
          <div className="mb-6">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--text-muted)" }}
            >
              Manually maintained
            </p>
            <h2 className="mt-1 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Manually Curated Datasets
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Some data on this platform is maintained by hand rather than fetched from live APIs. These datasets are
              periodically reviewed for accuracy, but may lag real-world changes between review cycles. Counts and
              details reflect the most recently verified snapshot.
            </p>
          </div>

          <div
            className="overflow-hidden rounded-2xl"
            style={{
              borderColor: "var(--border-subtle)",
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderBottomColor: "var(--border-subtle)",
                    borderBottomWidth: "1px",
                    borderBottomStyle: "solid",
                  }}
                >
                  <th
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Dataset
                  </th>
                  <th
                    className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider sm:table-cell"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Records
                  </th>
                  <th
                    className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider md:table-cell"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Last Verified
                  </th>
                  <th
                    className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider lg:table-cell"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Review Schedule
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { dataset: "Canadian AI Startups", records: "41 companies", lastVerified: "March 28, 2026", reviewSchedule: "Every 6 months" },
                  { dataset: "University AI Programs", records: "29 programs", lastVerified: "March 28, 2026", reviewSchedule: "Annually" },
                  { dataset: "Province & Territory Profiles", records: "13 regions", lastVerified: "March 28, 2026", reviewSchedule: "Annually" },
                  { dataset: "AI Events & Conferences", records: "13 events", lastVerified: "March 28, 2026", reviewSchedule: "Every 3 months" },
                ].map((row, idx) => (
                  <tr
                    key={row.dataset}
                    style={{
                      backgroundColor: "var(--surface-primary)",
                      borderTopColor: idx > 0 ? "var(--border-subtle)" : "transparent",
                      borderTopWidth: idx > 0 ? "1px" : "0",
                      borderTopStyle: "solid",
                    }}
                  >
                    <td className="px-4 py-3 align-top">
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {row.dataset}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            backgroundColor: "var(--surface-secondary)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {row.records}
                        </span>
                      </div>
                    </td>
                    <td
                      className="hidden px-4 py-3 align-top text-xs leading-relaxed sm:table-cell"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {row.records}
                    </td>
                    <td
                      className="hidden px-4 py-3 align-top text-xs md:table-cell"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {row.lastVerified}
                    </td>
                    <td
                      className="hidden px-4 py-3 align-top text-xs lg:table-cell"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {row.reviewSchedule}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* AI Processing */}
        <section className="mt-10" id="ai-processing">
          <div
            className="saas-card p-6 sm:p-7"
            style={{ backgroundColor: "var(--surface-primary)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--accent-primary)" }}
            >
              AI Processing
            </p>
            <h2 className="mt-1 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              How AI is used on this platform
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              AI enrichment is precomputed on a schedule and attached from cache when public story routes are served.
              AI does not run on normal user page requests.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border-subtle)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Classification
                </h3>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  <strong>gpt-4o-mini</strong> — categorizes stories by province, topic, and sentiment using keyword
                  matching and regex rules
                </p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border-subtle)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Summarization
                </h3>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  <strong>gpt-4o-mini</strong> — generates brief summaries (max 150 words) of news articles
                </p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border-subtle)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Executive Brief
                </h3>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  <strong>gpt-4o-mini</strong> — generates the daily Canada executive brief
                </p>
              </div>
            </div>

            <div
              className="mt-5 rounded-2xl p-4 text-sm leading-relaxed"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
                borderColor: "color-mix(in srgb, var(--accent-primary) 20%, transparent)",
                borderWidth: "1px",
                borderStyle: "solid",
                color: "var(--text-secondary)",
              }}
            >
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                AI does NOT:
              </p>
              <ul className="mt-2 space-y-1">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--accent-primary)" }} />
                  <span>make editorial judgments</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--accent-primary)" }} />
                  <span>select or rank sources</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--accent-primary)" }} />
                  <span>modify original content</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Quality & Limits */}
        <section className="mt-6">
          <div
            className="saas-card p-6 sm:p-7"
            style={{ backgroundColor: "var(--surface-primary)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--accent-primary)" }}
            >
              Data quality and limits
            </p>
            <h2 className="mt-1 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              What this dashboard is good for, and what it is not
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {limits.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--text-muted)" }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Disclaimer */}
        <div
          className="mt-6 rounded-2xl p-6"
          style={{
            backgroundColor: "var(--surface-secondary)",
            borderColor: "var(--border-subtle)",
            borderWidth: "1px",
            borderStyle: "solid",
          }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--text-primary)" }}
          >
            Disclaimer
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            AI Canada Pulse is an informational monitoring product. It does not provide financial, legal, regulatory, or
            policy advice. AI-generated summaries and briefs are generated from public-source headlines and short context
            snippets and may contain omissions or phrasing errors. Market data may be delayed. Always verify important
            claims with primary sources.
          </p>
        </div>
      </main>

      <ScrollToTop />
    </div>
  )
}
