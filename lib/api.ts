import type {
  BackfillRunRequest,
  BackfillRunResponse,
  EntitiesBreakdownResponse,
  BackfillStatus,
  EChartsResponse,
  FeedResponse,
  JurisdictionsBreakdownResponse,
  KPIsResponse,
  PurgeSyntheticResponse,
  StatsAlertsResponse,
  StatsBriefResponse,
  ScopeCompareResponse,
  ConfidenceProfileResponse,
  ConcentrationResponse,
  MomentumResponse,
  EntityMomentumResponse,
  RiskTrendResponse,
  SummaryResponse,
  CoverageResponse,
  RiskIndexResponse,
  TagsBreakdownResponse,
  SourcesBreakdownResponse,
  SourcesHealthResponse,
  TimeWindow,
} from "./types";

const API_BASE =
  typeof window !== "undefined"
    ? "/api/v1"
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1");

export interface FeedParams {
  time_window: TimeWindow;
  category?: string;
  jurisdiction?: string;
  language?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

function qsGeneric(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

function qsFeed(params: FeedParams): string {
  return qsGeneric({
    time_window: params.time_window,
    category: params.category,
    jurisdiction: params.jurisdiction,
    language: params.language,
    search: params.search,
    page: params.page,
    page_size: params.page_size,
  });
}

export async function fetchFeed(params: FeedParams): Promise<FeedResponse> {
  const query = qsFeed(params);
  const res = await fetch(`${API_BASE}/feed?${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch feed");
  return res.json();
}

export async function fetchKpis(): Promise<KPIsResponse> {
  const res = await fetch(`${API_BASE}/stats/kpis`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch kpis");
  return res.json();
}

export async function fetchHourly(): Promise<EChartsResponse> {
  const res = await fetch(`${API_BASE}/stats/hourly`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch hourly");
  return res.json();
}

export async function fetchWeekly(): Promise<EChartsResponse> {
  const res = await fetch(`${API_BASE}/stats/weekly`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch weekly");
  return res.json();
}

export function sseUrl(): string {
  return `${API_BASE}/feed/stream`;
}

export function exportUrl(params: FeedParams, fmt: "csv" | "json"): string {
  const query = qsGeneric({ ...params, fmt });
  return `${API_BASE}/feed/export?${query}`;
}

export async function runBackfill(payload: BackfillRunRequest): Promise<BackfillRunResponse> {
  const res = await fetch(`${API_BASE}/backfill/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to run backfill");
  return res.json();
}

export async function fetchBackfillStatus(): Promise<BackfillStatus> {
  const res = await fetch(`${API_BASE}/backfill/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch backfill status");
  return res.json();
}

export async function previewSyntheticPurge(): Promise<PurgeSyntheticResponse> {
  const res = await fetch(`${API_BASE}/maintenance/purge-synthetic?execute=false`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to preview synthetic purge");
  return res.json();
}

export async function executeSyntheticPurge(): Promise<PurgeSyntheticResponse> {
  const res = await fetch(`${API_BASE}/maintenance/purge-synthetic?execute=true`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to execute synthetic purge");
  return res.json();
}

export async function fetchSourcesHealth(): Promise<SourcesHealthResponse> {
  const res = await fetch(`${API_BASE}/sources/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch sources health");
  return res.json();
}

export async function fetchSourcesBreakdown(time_window: TimeWindow = "7d"): Promise<SourcesBreakdownResponse> {
  const res = await fetch(`${API_BASE}/stats/sources?time_window=${time_window}&limit=8`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch sources breakdown");
  return res.json();
}

export async function fetchJurisdictionsBreakdown(time_window: TimeWindow = "7d"): Promise<JurisdictionsBreakdownResponse> {
  const res = await fetch(`${API_BASE}/stats/jurisdictions?time_window=${time_window}&limit=12`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch jurisdictions breakdown");
  return res.json();
}

export async function fetchEntitiesBreakdown(time_window: TimeWindow = "7d"): Promise<EntitiesBreakdownResponse> {
  const res = await fetch(`${API_BASE}/stats/entities?time_window=${time_window}&limit=12`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch entities breakdown");
  return res.json();
}

export async function fetchTagsBreakdown(time_window: TimeWindow = "7d"): Promise<TagsBreakdownResponse> {
  const res = await fetch(`${API_BASE}/stats/tags?time_window=${time_window}&limit=14`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tags breakdown");
  return res.json();
}

export async function fetchAlerts(time_window: TimeWindow = "24h"): Promise<StatsAlertsResponse> {
  const res = await fetch(
    `${API_BASE}/stats/alerts?time_window=${time_window}&min_baseline=3&min_delta_percent=35&min_z_score=1.2`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function fetchBrief(time_window: TimeWindow = "24h"): Promise<StatsBriefResponse> {
  const res = await fetch(`${API_BASE}/stats/brief?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch brief snapshot");
  return res.json();
}

export async function fetchCompare(time_window: TimeWindow = "7d"): Promise<ScopeCompareResponse> {
  const res = await fetch(`${API_BASE}/stats/compare?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch scope compare");
  return res.json();
}

export async function fetchConfidence(time_window: TimeWindow = "7d"): Promise<ConfidenceProfileResponse> {
  const res = await fetch(`${API_BASE}/stats/confidence?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch confidence profile");
  return res.json();
}

export async function fetchConcentration(time_window: TimeWindow = "7d"): Promise<ConcentrationResponse> {
  const res = await fetch(`${API_BASE}/stats/concentration?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch concentration");
  return res.json();
}

export async function fetchMomentum(time_window: TimeWindow = "24h", limit = 8): Promise<MomentumResponse> {
  const res = await fetch(`${API_BASE}/stats/momentum?time_window=${time_window}&limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch momentum");
  return res.json();
}

export async function fetchRiskIndex(time_window: TimeWindow = "24h"): Promise<RiskIndexResponse> {
  const res = await fetch(`${API_BASE}/stats/risk-index?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch risk index");
  return res.json();
}

export async function fetchEntityMomentum(time_window: TimeWindow = "24h", limit = 10): Promise<EntityMomentumResponse> {
  const res = await fetch(`${API_BASE}/stats/entity-momentum?time_window=${time_window}&limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch entity momentum");
  return res.json();
}

export async function fetchRiskTrend(time_window: TimeWindow = "24h"): Promise<RiskTrendResponse> {
  const res = await fetch(`${API_BASE}/stats/risk-trend?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch risk trend");
  return res.json();
}

export async function fetchSummary(time_window: TimeWindow = "24h"): Promise<SummaryResponse> {
  const res = await fetch(`${API_BASE}/stats/summary?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function fetchCoverage(time_window: TimeWindow = "7d", limit = 8): Promise<CoverageResponse> {
  const res = await fetch(`${API_BASE}/stats/coverage?time_window=${time_window}&limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch coverage");
  return res.json();
}
