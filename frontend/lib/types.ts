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
