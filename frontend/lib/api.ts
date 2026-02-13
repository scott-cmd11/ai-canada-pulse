import type {
  BackfillRunRequest,
  BackfillRunResponse,
  BackfillStatus,
  EChartsResponse,
  FeedResponse,
  KPIsResponse,
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
