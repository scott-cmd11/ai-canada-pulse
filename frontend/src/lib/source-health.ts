import type { DataSource } from "@/lib/source-registry"
import { SOURCES } from "@/lib/source-registry"

export type SourceHealthStatus = "live" | "stale" | "fallback" | "curated" | "mixed" | "unverified"

export interface ObservedSourceHealth {
  id: string
  label?: string
  status?: string
  tableId?: string
  sourceUrl?: string
  fetchedAt?: string | null
  releaseTime?: string | null
}

export interface SourceHealthRow {
  id: string
  name: string
  url: string
  description: string
  refreshInterval: string
  sourceStatus: DataSource["sourceStatus"]
  evidenceRole: DataSource["evidenceRole"]
  fetchMethod: DataSource["fetchMethod"]
  reliability: DataSource["reliability"]
  dataScope: DataSource["dataScope"]
  status: SourceHealthStatus
  statusLabel: string
  evidenceLabel: string
  lastCheckedAt: string | null
  upstreamReleaseAt: string | null
  sourceUrl: string
  detail: string
}

const SOURCE_ID_ALIASES: Record<string, string> = {
  "gc-ai-register": "gov-ai-register",
}

const EVIDENCE_LABELS: Record<DataSource["evidenceRole"], string> = {
  "adoption-rate": "Direct adoption rate",
  "public-sector-system": "Public-sector system evidence",
  "demand-signal": "Demand signal",
  "proxy-signal": "Proxy signal",
  context: "Context source",
  "source-feed": "Source feed",
}

const STATUS_LABELS: Record<SourceHealthStatus, string> = {
  live: "Verified live",
  stale: "Stale",
  fallback: "Fallback",
  curated: "Manually curated",
  mixed: "Mixed",
  unverified: "Configured live",
}

function normaliseSourceId(id: string): string {
  return SOURCE_ID_ALIASES[id] ?? id
}

function intervalToHours(interval: string): number | null {
  const normalised = interval.trim().toLowerCase()
  if (normalised.endsWith("m")) {
    const minutes = Number.parseInt(normalised, 10)
    return Number.isFinite(minutes) ? minutes / 60 : null
  }
  if (normalised.endsWith("h")) {
    const hours = Number.parseInt(normalised, 10)
    return Number.isFinite(hours) ? hours : null
  }
  if (normalised === "weekly") return 24 * 7
  if (normalised === "quarterly") return 24 * 92
  if (normalised === "annually") return 24 * 366
  return null
}

function isPastStaleWindow(fetchedAt: string | null | undefined, refreshInterval: string): boolean {
  if (!fetchedAt) return false
  const hours = intervalToHours(refreshInterval)
  if (!hours) return false
  const fetchedTime = new Date(fetchedAt).getTime()
  if (!Number.isFinite(fetchedTime)) return false
  const staleAfterMs = hours * 2 * 60 * 60 * 1000
  return Date.now() - fetchedTime > staleAfterMs
}

function toHealthStatus(source: DataSource, observed?: ObservedSourceHealth): SourceHealthStatus {
  if (source.sourceStatus === "curated") return "curated"

  if (observed?.status?.toLowerCase().includes("fallback")) {
    return "fallback"
  }

  if (observed?.fetchedAt) {
    return isPastStaleWindow(observed.fetchedAt, source.refreshInterval) ? "stale" : "live"
  }

  if (source.sourceStatus === "mixed") return "mixed"
  return "unverified"
}

function getDetail(source: DataSource, status: SourceHealthStatus, observed?: ObservedSourceHealth): string {
  if (status === "live") {
    return "Observed on the public status endpoint inside the expected refresh window."
  }
  if (status === "stale") {
    return "Observed, but the last fetch is outside twice the expected refresh window."
  }
  if (status === "fallback") {
    return "Upstream fetch failed or returned unusable data, so the site is using labelled fallback data."
  }
  if (status === "curated") {
    return "Maintained by review rather than a live fetch. Treat as the latest verified snapshot."
  }
  if (status === "mixed") {
    return observed?.fetchedAt
      ? "Partly automated, with some review or sampling limits."
      : "Partly automated, but not independently timestamped in the status endpoint yet."
  }
  return "Configured as an automated source, but this endpoint does not yet expose a last-checked timestamp."
}

export function buildSourceHealthRows(observedHealth: ObservedSourceHealth[] = []): SourceHealthRow[] {
  const observedById = new Map(
    observedHealth.map((health) => [normaliseSourceId(health.id), health])
  )

  return SOURCES.map((source) => {
    const observed = observedById.get(source.id)
    const status = toHealthStatus(source, observed)

    return {
      id: source.id,
      name: source.name,
      url: source.url,
      description: source.description,
      refreshInterval: source.refreshInterval,
      sourceStatus: source.sourceStatus,
      evidenceRole: source.evidenceRole,
      fetchMethod: source.fetchMethod,
      reliability: source.reliability,
      dataScope: source.dataScope,
      status,
      statusLabel: STATUS_LABELS[status],
      evidenceLabel: EVIDENCE_LABELS[source.evidenceRole],
      lastCheckedAt: observed?.fetchedAt ?? null,
      upstreamReleaseAt: observed?.releaseTime ?? null,
      sourceUrl: observed?.sourceUrl ?? source.url,
      detail: getDetail(source, status, observed),
    }
  })
}

export function countSourceHealthStatuses(rows: SourceHealthRow[]) {
  return rows.reduce<Record<SourceHealthStatus, number>>((counts, row) => {
    counts[row.status] += 1
    return counts
  }, {
    live: 0,
    stale: 0,
    fallback: 0,
    curated: 0,
    mixed: 0,
    unverified: 0,
  })
}
