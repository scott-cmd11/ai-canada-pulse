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
  SourcesBreakdownResponse,
  SourcesHealthResponse,
  TimeWindow,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

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

export async function fetchAlerts(time_window: TimeWindow = "24h"): Promise<StatsAlertsResponse> {
  const res = await fetch(
    `${API_BASE}/stats/alerts?time_window=${time_window}&min_baseline=3&min_delta_percent=35`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}
