import type { EChartsResponse, FeedResponse, KPIsResponse, TimeWindow } from "./types";

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

function qs(params: FeedParams): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

export async function fetchFeed(params: FeedParams): Promise<FeedResponse> {
  const query = qs(params);
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
