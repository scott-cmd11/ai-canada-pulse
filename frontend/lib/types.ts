export type Category = "policy" | "research" | "industry" | "funding" | "news" | "incidents";
export type TimeWindow = "1h" | "24h" | "7d" | "30d";
export type Mode = "policy" | "research";

export interface FeedItem {
  id: string;
  source_id: string;
  source_type: string;
  category: Category;
  title: string;
  url: string;
  publisher: string;
  published_at: string;
  ingested_at: string;
  language: string;
  jurisdiction: string;
  entities: string[];
  tags: string[];
  hash: string;
  confidence: number;
}

export interface FeedResponse {
  items: FeedItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface KPIWindow {
  current: number;
  previous: number;
  delta_percent: number;
}

export interface KPIsResponse {
  m15: KPIWindow;
  h1: KPIWindow;
  d7: KPIWindow;
}

export interface EChartsSeries {
  name: string;
  type: string;
  stack?: string;
  areaStyle?: Record<string, unknown>;
  emphasis?: Record<string, unknown>;
  data: number[];
}

export interface EChartsResponse {
  legend: string[];
  xAxis: string[];
  series: EChartsSeries[];
}

export interface BackfillRunRequest {
  start_date: string;
  end_date?: string;
  per_page: number;
  max_pages_per_month: number;
}

export interface BackfillRunResponse {
  status: string;
  task_id: string;
}

export interface BackfillStatus {
  state: "idle" | "running" | "completed" | "failed" | string;
  started_at?: string;
  finished_at?: string;
  failed_at?: string;
  checked_at?: string;
  start_date?: string;
  end_date?: string;
  current_month?: string;
  scanned?: number;
  inserted?: number;
  error?: string;
}

export interface PurgeSyntheticResponse {
  execute: boolean;
  synthetic_before: number;
  deleted: number;
  synthetic_after: number;
  checked_at: string;
}

export interface SourceHealthEntry {
  source: string;
  status: string;
  fetched: number;
  accepted: number;
  inserted: number;
  duplicates: number;
  write_errors: number;
  duration_ms: number;
  last_run: string;
  error: string;
}

export interface SourcesHealthResponse {
  updated_at: string;
  run_status?: string;
  inserted_total?: number;
  candidates_total?: number;
  skipped_lock_count?: number;
  sources: SourceHealthEntry[];
}

export interface SourcesBreakdownEntry {
  name: string;
  count: number;
}

export interface SourcesBreakdownResponse {
  time_window: TimeWindow;
  total: number;
  publishers: SourcesBreakdownEntry[];
  source_types: SourcesBreakdownEntry[];
}

export interface JurisdictionsBreakdownResponse {
  time_window: TimeWindow;
  total: number;
  jurisdictions: SourcesBreakdownEntry[];
}

export interface EntitiesBreakdownResponse {
  time_window: TimeWindow;
  total: number;
  entities: SourcesBreakdownEntry[];
}

export interface TagsBreakdownResponse {
  time_window: TimeWindow;
  total: number;
  tags: SourcesBreakdownEntry[];
}

export interface StatsAlertItem {
  category: Category;
  direction: "up" | "down";
  severity: "medium" | "high";
  current: number;
  previous: number;
  delta_percent: number;
}

export interface StatsAlertsResponse {
  generated_at: string;
  time_window: TimeWindow;
  min_baseline: number;
  min_delta_percent: number;
  alerts: StatsAlertItem[];
}

export interface StatsBriefPoint {
  name: string;
  count: number;
}

export interface StatsBriefResponse {
  generated_at: string;
  time_window: TimeWindow;
  total_items: number;
  high_alert_count: number;
  top_category: StatsBriefPoint;
  top_jurisdiction: StatsBriefPoint;
  top_publisher: StatsBriefPoint;
  top_tag: StatsBriefPoint;
}
