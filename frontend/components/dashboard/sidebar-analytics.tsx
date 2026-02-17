"use client";

import { Component, memo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Activity, AlertTriangle, BarChart3, Shield, TrendingUp, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  ConfidenceProfileResponse,
  EChartsResponse,
  Mode,
  MomentumResponse,
  RiskTrendResponse,
  SourceHealthEntry,
  StatsAlertItem,
} from "../../lib/types";
import { confidenceTone } from "./constants";

const EChartsReact = dynamic(() => import("echarts-for-react"), { ssr: false });

/* ---- ECharts Error Boundary ---- */
interface ChartBoundaryProps { children: ReactNode; label: string; }
interface ChartBoundaryState { hasError: boolean; }

class ChartErrorBoundary extends Component<ChartBoundaryProps, ChartBoundaryState> {
  constructor(props: ChartBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[200px] items-center justify-center rounded-lg bg-surfaceInset text-caption text-textMuted">
          <AlertTriangle size={14} className="mr-2" />
          Chart unavailable &mdash; {this.props.label}
        </div>
      );
    }
    return this.props.children;
  }
}

interface SidebarAnalyticsProps {
  mode: Mode;
  panelVisibility: Record<string, boolean>;
  sourceHealth: SourceHealthEntry[];
  sourceHealthUpdatedAt: string;
  sourceHealthRunStatus: string;
  sourceHealthInsertedTotal: number;
  sourceHealthCandidatesTotal: number;
  sourceHealthSkippedLockCount: number;
  confidenceProfile: ConfidenceProfileResponse | null;
  riskTrendOption: Record<string, unknown>;
  momentum: MomentumResponse | null;
  alerts: StatsAlertItem[];
  hourly: EChartsResponse | null;
  hourlyOption: Record<string, unknown>;
  weekly: EChartsResponse | null;
  weeklyOption: Record<string, unknown>;
  chartEvents: Record<string, (params: { seriesName?: string }) => void>;
  onSetCategory: (cat: string) => void;
  onSetSearch: (q: string) => void;
  onSetMode: (m: Mode) => void;
}

export const SidebarAnalytics = memo(function SidebarAnalytics({
  mode,
  panelVisibility,
  sourceHealth,
  sourceHealthUpdatedAt,
  sourceHealthRunStatus,
  sourceHealthInsertedTotal,
  sourceHealthCandidatesTotal,
  sourceHealthSkippedLockCount,
  confidenceProfile,
  riskTrendOption,
  momentum,
  alerts,
  hourly,
  hourlyOption,
  weekly,
  weeklyOption,
  chartEvents,
  onSetCategory,
  onSetSearch,
  onSetMode,
}: SidebarAnalyticsProps) {
  const t = useTranslations();

  return (
    <>
      {/* Charts moved up for visibility */}
      {panelVisibility.hourly && (
        <section className="elevated p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-1.5 text-subheading text-textSecondary">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
                <BarChart3 size={13} className="text-primary" />
              </div>
              {t("charts.hourly")}
            </h3>
            <span className="text-caption text-textMuted">
              {t("charts.drilldownHint")}
            </span>
          </div>
          <ChartErrorBoundary label="Hourly">
            {hourly ? (
              <EChartsReact
                option={hourlyOption}
                onEvents={chartEvents}
                style={{ height: 280 }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-caption text-textMuted">
                {t("charts.loading")}
              </div>
            )}
          </ChartErrorBoundary>
        </section>
      )}
      {panelVisibility.weekly && (
        <section className="elevated p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-1.5 text-subheading text-textSecondary">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
                <BarChart3 size={13} className="text-primary" />
              </div>
              {t("charts.weekly")}
            </h3>
            <span className="text-caption text-textMuted">
              {t("charts.drilldownHint")}
            </span>
          </div>
          <ChartErrorBoundary label="Weekly">
            {weekly ? (
              <EChartsReact
                option={weeklyOption}
                onEvents={chartEvents}
                style={{ height: 320 }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-caption text-textMuted">
                {t("charts.loading")}
              </div>
            )}
          </ChartErrorBoundary>
        </section>
      )}

      {/* Source Health */}
      {mode === "research" && panelVisibility.sourceHealth && (
        <section className="elevated p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-1.5 text-subheading text-textSecondary">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
                <Activity size={13} className="text-primary" />
              </div>
              {t("sources.title")}
            </h3>
            <span className="text-caption text-textMuted">
              {t("sources.updated")}:{" "}
              {sourceHealthUpdatedAt
                ? new Date(sourceHealthUpdatedAt).toLocaleTimeString()
                : "-"}
            </span>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-1 text-caption text-textSecondary">
            <span>
              {t("sources.runStatus")}: {sourceHealthRunStatus || "-"}
            </span>
            <span>
              {t("sources.insertedTotal")}: {sourceHealthInsertedTotal}
            </span>
            <span>
              {t("sources.candidatesTotal")}: {sourceHealthCandidatesTotal}
            </span>
            <span>
              {t("sources.skippedLockCount")}: {sourceHealthSkippedLockCount}
            </span>
          </div>
          <div className="space-y-2 text-caption">
            {sourceHealth.length === 0 && (
              <p className="py-4 text-center text-caption text-textMuted italic">No source health yet.</p>
            )}
            {sourceHealth.map((src) => (
              <div
                key={src.source}
                className="rounded-lg bg-surfaceInset px-3 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{src.source}</span>
                  <span
                    className={
                      src.status === "ok" ? "text-statusPositive" : "text-statusNegative"
                    }
                  >
                    {src.status}
                  </span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1 text-textSecondary">
                  <span>
                    {t("sources.fetched")}: {src.fetched}
                  </span>
                  <span>
                    {t("sources.accepted")}: {src.accepted}
                  </span>
                  <span>
                    {t("sources.inserted")}: {src.inserted}
                  </span>
                  <span>
                    {t("sources.duplicates")}: {src.duplicates ?? 0}
                  </span>
                  <span>
                    {t("sources.writeErrors")}: {src.write_errors ?? 0}
                  </span>
                  <span>
                    {t("sources.duration")}: {src.duration_ms}ms
                  </span>
                </div>
                {src.error ? (
                  <p className="mt-1 text-statusNegative">
                    {t("sources.error")}: {src.error}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confidence Profile */}
      {mode === "research" && panelVisibility.confidenceProfile && (
        <section className="elevated p-3">
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-subheading text-textSecondary">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
              <Shield size={13} className="text-primary" />
            </div>
            {t("confidence.title")}
          </h3>
          <p className="mb-2 text-caption text-textMuted">
            {t("confidence.average")}:{" "}
            {(confidenceProfile?.average_confidence ?? 0).toFixed(2)}
          </p>
          <div className="space-y-2 text-caption">
            {(confidenceProfile?.buckets ?? []).map((bucket) => (
              <div
                key={bucket.name}
                className="rounded-lg bg-surfaceInset px-3 py-2.5"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span>{t(`confidence.${bucket.name}`)}</span>
                  <span>
                    {bucket.count} ({bucket.percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-1.5 rounded bg-bg">
                  <div
                    className="h-1.5 rounded"
                    style={{
                      width: `${Math.max(2, Math.round(bucket.percent))}%`,
                      background:
                        confidenceTone[bucket.name] ?? "var(--primary-action)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Risk Trend */}
      {mode === "research" && panelVisibility.riskTrend && (
        <section className="elevated p-3">
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-subheading text-textSecondary">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
              <AlertTriangle size={13} className="text-primary" />
            </div>
            {t("riskTrend.title")}
          </h3>
          <ChartErrorBoundary label="Risk Trend">
            <EChartsReact
              option={riskTrendOption}
              style={{ height: 240 }}
              notMerge
              lazyUpdate
            />
          </ChartErrorBoundary>
        </section>
      )}

      {/* Momentum */}
      {mode === "research" && panelVisibility.momentum && (
        <section className="elevated p-3">
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-subheading text-textSecondary">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
              <TrendingUp size={13} className="text-primary" />
            </div>
            {t("momentum.title")}
          </h3>
          <div className="space-y-2 text-caption">
            <p className="font-medium text-textSecondary">
              {t("momentum.categories")}
            </p>
            {(momentum?.categories ?? []).slice(0, 5).map((item) => (
              <button
                key={`cat-${item.name}`}
                onClick={() => {
                  onSetCategory(item.name);
                  onSetMode("research");
                }}
                className="btn-ghost flex w-full items-center justify-between text-left"
              >
                <span className="capitalize">{item.name}</span>
                <span
                  style={{
                    color:
                      item.change >= 0
                        ? "var(--research)"
                        : "var(--incidents)",
                  }}
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change} ({item.delta_percent.toFixed(1)}%)
                </span>
              </button>
            ))}
            <p className="pt-1 font-medium text-textSecondary">
              {t("momentum.publishers")}
            </p>
            {(momentum?.publishers ?? []).slice(0, 5).map((item) => (
              <button
                key={`pub-${item.name}`}
                onClick={() => {
                  onSetSearch(item.name);
                  onSetMode("research");
                }}
                className="btn-ghost flex w-full items-center justify-between text-left"
              >
                <span className="truncate pr-2">{item.name}</span>
                <span
                  style={{
                    color:
                      item.change >= 0
                        ? "var(--research)"
                        : "var(--incidents)",
                  }}
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change} ({item.delta_percent.toFixed(1)}%)
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Alerts */}
      {mode === "research" && panelVisibility.alerts && (
        <section className="elevated p-3">
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-subheading text-textSecondary">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
              <Zap size={13} className="text-primary" />
            </div>
            {t("alerts.title")}
          </h3>
          <div className="space-y-2 text-caption">
            {alerts.length === 0 && (
              <p className="py-4 text-center text-caption text-textMuted italic">{t("alerts.none")}</p>
            )}
            {alerts.map((item) => {
              const isUp = item.direction === "up";
              const tone =
                item.severity === "high"
                  ? "var(--incidents)"
                  : "var(--warning)";
              const triggerLabel = item.trigger_reason
                ? t(`alerts.triggerReason.${item.trigger_reason}`)
                : null;
              const baselineMean =
                typeof item.baseline_mean === "number" ? item.baseline_mean : null;
              const baselineStd =
                typeof item.baseline_stddev === "number"
                  ? item.baseline_stddev
                  : 0;
              return (
                <div
                  key={`${item.category}-${item.direction}`}
                  className="rounded-lg bg-surfaceInset px-3 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {item.category}
                    </span>
                    <span style={{ color: tone }}>
                      {isUp ? t("alerts.spike") : t("alerts.drop")}{" "}
                      {item.delta_percent > 0 ? "+" : ""}
                      {item.delta_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 text-textSecondary">
                    {t("alerts.current")}: {item.current} |{" "}
                    {t("alerts.previous")}: {item.previous}
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-textMuted">
                    {triggerLabel ? (
                      <div className="text-xs font-semibold text-textSecondary">
                        {triggerLabel}
                      </div>
                    ) : null}
                    {typeof item.z_score === "number" ? (
                      <div className="flex items-center justify-between">
                        <span>{t("alerts.zScore")}</span>
                        <span className="font-semibold text-textSecondary">
                          {item.z_score.toFixed(2)}
                        </span>
                      </div>
                    ) : null}
                    {baselineMean !== null ? (
                      <div className="flex items-center justify-between">
                        <span>{t("alerts.baseline")}</span>
                        <span className="font-semibold text-textSecondary">
                          {baselineMean.toFixed(1)} ±{" "}
                          {baselineStd.toFixed(1)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
});
