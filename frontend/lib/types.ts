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

export interface ScopeCompareCategory {
  name: string;
  canada: number;
  global: number;
}

export interface ScopeCompareResponse {
  generated_at: string;
  time_window: TimeWindow;
  total: number;
  canada: number;
  global: number;
  other: number;
  categories: ScopeCompareCategory[];
}

export interface ConfidenceBucket {
  name: "very_high" | "high" | "medium" | "low";
  count: number;
  percent: number;
}

export interface ConfidenceProfileResponse {
  generated_at: string;
  time_window: TimeWindow;
  total: number;
  average_confidence: number;
  buckets: ConfidenceBucket[];
}

export interface ConcentrationPoint {
  name: string;
  count: number;
}

export interface ConcentrationResponse {
  generated_at: string;
  time_window: TimeWindow;
  total: number;
  source_hhi: number;
  source_level: "low" | "medium" | "high";
  jurisdiction_hhi: number;
  jurisdiction_level: "low" | "medium" | "high";
  category_hhi: number;
  category_level: "low" | "medium" | "high";
  combined_hhi: number;
  combined_level: "low" | "medium" | "high";
  top_sources: ConcentrationPoint[];
  top_jurisdictions: ConcentrationPoint[];
}

export interface MomentumItem {
  name: string;
  current: number;
  previous: number;
  change: number;
  delta_percent: number;
}

export interface MomentumResponse {
  generated_at: string;
  time_window: TimeWindow;
  categories: MomentumItem[];
  publishers: MomentumItem[];
}

export interface RiskIndexResponse {
  generated_at: string;
  time_window: TimeWindow;
  score: number;
  level: "low" | "medium" | "high";
  total: number;
  incidents: number;
  low_confidence: number;
  high_alert_count: number;
  incidents_ratio: number;
  low_confidence_ratio: number;
  combined_hhi: number;
  reasons: string[];
}

export interface EntityMomentumItem {
  name: string;
  current: number;
  previous: number;
  change: number;
  delta_percent: number;
}

export interface EntityMomentumResponse {
  generated_at: string;
  time_window: TimeWindow;
  entities: EntityMomentumItem[];
}

export interface RiskTrendResponse {
  generated_at: string;
  time_window: TimeWindow;
  xAxis: string[];
  risk_score: number[];
  incidents_ratio_pct: number[];
  low_confidence_ratio_pct: number[];
}

export interface SummaryResponse {
  generated_at: string;
  time_window: TimeWindow;
  bullets: string[];
}

export interface CoverageRow {
  name: string;
  count: number;
  percent: number;
}

export interface CoverageResponse {
  generated_at: string;
  time_window: TimeWindow;
  total: number;
  categories: CoverageRow[];
  source_types: CoverageRow[];
  languages: CoverageRow[];
  jurisdictions: CoverageRow[];
}
