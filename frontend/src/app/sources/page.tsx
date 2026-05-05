import Header from "@/components/Header"
import ScrollToTop from "@/components/ScrollToTop"
import { fetchGovAIRegistry } from "@/lib/gov-ai-registry-client"
import { fetchProcurementDemand } from "@/lib/procurement-demand-client"
import { buildSourceHealthRows, countSourceHealthStatuses, type SourceHealthStatus } from "@/lib/source-health"
import { fetchStatCanAdoption } from "@/lib/statcan-sdmx-client"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Source Health",
  description: "Live, stale, fallback, and curated source status for AI Canada Pulse.",
}

const STATUS_STYLES: Record<SourceHealthStatus, { bg: string; colour: string }> = {
  live: { bg: "rgba(22, 163, 74, 0.10)", colour: "#15803d" },
  stale: { bg: "rgba(220, 38, 38, 0.10)", colour: "#b91c1c" },
  fallback: { bg: "rgba(245, 158, 11, 0.12)", colour: "#b45309" },
  curated: { bg: "var(--surface-secondary)", colour: "var(--text-muted)" },
  mixed: { bg: "rgba(245, 158, 11, 0.10)", colour: "#b45309" },
  unverified: { bg: "rgba(71, 85, 105, 0.10)", colour: "var(--text-secondary)" },
}

const STATUS_SUMMARY_LABELS: Record<SourceHealthStatus, string> = {
  live: "Verified live",
  stale: "Stale",
  fallback: "Fallback",
  mixed: "Mixed",
  curated: "Curated",
  unverified: "Auto feeds",
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not timestamped"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Winnipeg",
  }).format(date)
}

function formatSourceStatus(status: string): string {
  return status === "curated" ? "Manual review" : status === "mixed" ? "Mixed automation" : "Automated"
}

export default async function SourcesPage() {
  const [adoption, aiRegister, procurement] = await Promise.all([
    fetchStatCanAdoption().catch(() => null),
    fetchGovAIRegistry().catch(() => null),
    fetchProcurementDemand().catch(() => null),
  ])

  const rows = buildSourceHealthRows([
    ...(adoption?.sourceHealth ?? []),
    ...(aiRegister?.sourceHealth ?? []),
    ...(procurement?.sourceHealth ?? []),
  ])
  const counts = countSourceHealthStatuses(rows)
  const checkedCount = rows.filter((row) => row.lastCheckedAt).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <Header />

      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            &lt;- Back to Dashboard
          </Link>
        </div>

        <section
          className="rounded-[8px] px-5 py-7 sm:px-7"
          style={{
            backgroundColor: "var(--surface-primary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--accent-primary)" }}
          >
            Source health
          </p>
          <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
                What updates automatically, and what needs review
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
                This page separates verified live sources, configured automated feeds, mixed sources, fallbacks, and manually curated references. Direct adoption rates come from Statistics Canada; demand, search, code, news, and market sources are labelled as signals or context.
              </p>
            </div>
            <div
              className="grid grid-cols-2 gap-2 rounded-[8px] p-3"
              style={{ backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Sources</p>
                <p className="mt-1 text-2xl font-bold">{rows.length}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Timestamped</p>
                <p className="mt-1 text-2xl font-bold">{checkedCount}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Live</p>
                <p className="mt-1 text-2xl font-bold">{counts.live}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Manual</p>
                <p className="mt-1 text-2xl font-bold">{counts.curated}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap gap-2">
            {(["live", "stale", "fallback", "mixed", "curated", "unverified"] as SourceHealthStatus[]).map((status) => {
              const style = STATUS_STYLES[status]
              return (
                <span
                  key={status}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: style.bg, color: style.colour }}
                >
                  {STATUS_SUMMARY_LABELS[status]}: {counts[status]}
                </span>
              )
            })}
          </div>

          <div
            className="overflow-x-auto rounded-[8px]"
            style={{ backgroundColor: "var(--surface-primary)", border: "1px solid var(--border-subtle)" }}
          >
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--surface-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Source", "Status", "Role", "Cadence", "Last checked", "Evidence note"].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const statusStyle = STATUS_STYLES[row.status]
                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderTop: index > 0 ? "1px solid var(--border-subtle)" : "0",
                      }}
                    >
                      <td className="px-4 py-4 align-top">
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold hover:underline"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          {row.name}
                        </a>
                        <p className="mt-1 max-w-[280px] text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {row.description}
                        </p>
                      </td>
                      <td className="min-w-[132px] px-4 py-4 align-top">
                        <span
                          className="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.colour }}
                        >
                          {row.statusLabel}
                        </span>
                        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatSourceStatus(row.sourceStatus)}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="text-xs font-semibold" style={{ color: row.evidenceRole === "adoption-rate" ? "var(--accent-primary)" : "var(--text-primary)" }}>
                          {row.evidenceLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className="rounded-full px-2 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: "color-mix(in srgb, var(--accent-primary) 8%, transparent)", color: "var(--accent-primary)" }}
                        >
                          {row.refreshInterval}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {formatDateTime(row.lastCheckedAt)}
                        {row.upstreamReleaseAt && (
                          <span className="mt-1 block" style={{ color: "var(--text-muted)" }}>
                            Source release: {formatDateTime(row.upstreamReleaseAt)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {row.detail}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="mt-8 rounded-[8px] p-5"
          style={{ backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <h2 className="text-sm font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-primary)" }}>
            Freshness policy
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            A timestamped source is marked stale when its last successful fetch is older than twice its expected refresh cadence. Curated sources are not treated as live feeds and should be reviewed on their stated schedule. Proxy and demand signals are never presented as direct AI adoption rates.
          </p>
        </section>
      </main>

      <ScrollToTop />
    </div>
  )
}
