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

import {
  MOCK_KPIs,
  MOCK_FEED_ITEMS,
  MOCK_HOURLY,
  MOCK_WEEKLY,
  MOCK_SOURCES,
  MOCK_JURISDICTIONS,
  MOCK_ENTITIES,
  MOCK_TAGS,
  MOCK_BRIEF,
  MOCK_COMPARE,
  MOCK_CONFIDENCE,
  MOCK_CONCENTRATION,
  MOCK_MOMENTUM,
  MOCK_RISK_INDEX,
  MOCK_ENTITY_MOMENTUM,
  MOCK_RISK_TREND,
  MOCK_SUMMARY,
  MOCK_COVERAGE,
} from "./mock-data";

const API_BASE = "/api/v1";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";


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
  if (USE_MOCK_DATA) {
    return { items: MOCK_FEED_ITEMS, total: MOCK_FEED_ITEMS.length, page: 1, page_size: MOCK_FEED_ITEMS.length };
  }
  const query = qsFeed(params);
  const res = await fetch(`${API_BASE}/feed?${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch feed");
  return res.json();
}

export async function fetchKpis(): Promise<KPIsResponse> {
  if (USE_MOCK_DATA) return MOCK_KPIs;
  const res = await fetch(`${API_BASE}/stats/kpis`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch kpis");
  return res.json();
}

export async function fetchHourly(): Promise<EChartsResponse> {
  if (USE_MOCK_DATA) return MOCK_HOURLY;
  const res = await fetch(`${API_BASE}/stats/hourly`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch hourly");
  return res.json();
}

export async function fetchWeekly(): Promise<EChartsResponse> {
  if (USE_MOCK_DATA) return MOCK_WEEKLY;
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
  if (USE_MOCK_DATA) return MOCK_SOURCES;
  const res = await fetch(`${API_BASE}/stats/sources?time_window=${time_window}&limit=8`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch sources breakdown");
  return res.json();
}

export async function fetchJurisdictionsBreakdown(time_window: TimeWindow = "7d"): Promise<JurisdictionsBreakdownResponse> {
  if (USE_MOCK_DATA) return MOCK_JURISDICTIONS;
  const res = await fetch(`${API_BASE}/stats/jurisdictions?time_window=${time_window}&limit=12`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch jurisdictions breakdown");
  return res.json();
}

export async function fetchEntitiesBreakdown(time_window: TimeWindow = "7d"): Promise<EntitiesBreakdownResponse> {
  if (USE_MOCK_DATA) return MOCK_ENTITIES;
  const res = await fetch(`${API_BASE}/stats/entities?time_window=${time_window}&limit=12`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch entities breakdown");
  return res.json();
}

export async function fetchTagsBreakdown(time_window: TimeWindow = "7d"): Promise<TagsBreakdownResponse> {
  if (USE_MOCK_DATA) return MOCK_TAGS;
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
  if (USE_MOCK_DATA) return MOCK_BRIEF;
  const res = await fetch(`${API_BASE}/stats/brief?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch brief snapshot");
  return res.json();
}

export async function fetchCompare(time_window: TimeWindow = "7d"): Promise<ScopeCompareResponse> {
  if (USE_MOCK_DATA) return MOCK_COMPARE;
  const res = await fetch(`${API_BASE}/stats/compare?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch scope compare");
  return res.json();
}

export async function fetchConfidence(time_window: TimeWindow = "7d"): Promise<ConfidenceProfileResponse> {
  if (USE_MOCK_DATA) return MOCK_CONFIDENCE;
  const res = await fetch(`${API_BASE}/stats/confidence?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch confidence profile");
  return res.json();
}

export async function fetchConcentration(time_window: TimeWindow = "7d"): Promise<ConcentrationResponse> {
  if (USE_MOCK_DATA) return MOCK_CONCENTRATION;
  const res = await fetch(`${API_BASE}/stats/concentration?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch concentration");
  return res.json();
}

export async function fetchMomentum(time_window: TimeWindow = "24h", limit = 8): Promise<MomentumResponse> {
  if (USE_MOCK_DATA) return MOCK_MOMENTUM;
  const res = await fetch(`${API_BASE}/stats/momentum?time_window=${time_window}&limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch momentum");
  return res.json();
}

export async function fetchRiskIndex(time_window: TimeWindow = "24h"): Promise<RiskIndexResponse> {
  if (USE_MOCK_DATA) return MOCK_RISK_INDEX;
  const res = await fetch(`${API_BASE}/stats/risk-index?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch risk index");
  return res.json();
}

export async function fetchEntityMomentum(time_window: TimeWindow = "24h", limit = 10): Promise<EntityMomentumResponse> {
  if (USE_MOCK_DATA) return MOCK_ENTITY_MOMENTUM;
  const res = await fetch(`${API_BASE}/stats/entity-momentum?time_window=${time_window}&limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch entity momentum");
  return res.json();
}

export async function fetchRiskTrend(time_window: TimeWindow = "24h"): Promise<RiskTrendResponse> {
  if (USE_MOCK_DATA) return MOCK_RISK_TREND;
  const res = await fetch(`${API_BASE}/stats/risk-trend?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch risk trend");
  return res.json();
}

export async function fetchSummary(time_window: TimeWindow = "24h"): Promise<SummaryResponse> {
  if (USE_MOCK_DATA) return MOCK_SUMMARY;
  const res = await fetch(`${API_BASE}/stats/summary?time_window=${time_window}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function fetchCoverage(time_window: TimeWindow = "7d", limit = 8): Promise<CoverageResponse> {
  if (USE_MOCK_DATA) return MOCK_COVERAGE;
  const res = await fetch(`${API_BASE}/stats/coverage?time_window=${time_window}&limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch coverage");
  return res.json();
}
