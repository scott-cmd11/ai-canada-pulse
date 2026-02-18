"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import {
  fetchFeed,
  fetchKpis,
  fetchSourcesBreakdown,
  fetchJurisdictionsBreakdown,
  fetchBrief,
  fetchCompare,
  fetchRiskIndex,
  fetchCoverage,
  fetchMomentum,
  fetchSummary,
} from "../lib/api";
import type {
  FeedItem,
  StatsBriefResponse,
  ScopeCompareResponse,
  CoverageResponse,
  MomentumResponse,
  RiskIndexResponse,
  SummaryResponse,
  KPIsResponse,
  SourcesBreakdownResponse,
  JurisdictionsBreakdownResponse,
  TimeWindow,
} from "../lib/types";
import { useTheme } from "./theme-provider";

import { categoryColor, isCanadaJurisdiction } from "./dashboard/constants";
import { Delta } from "./dashboard/helpers";
import { DetailModal } from "./dashboard/detail-modal";
import { QuickGuideButton, QuickGuidePanel } from "./dashboard/quick-guide";
import { DashboardShell } from "./dashboard/shell";
import { MetricTile, Tile } from "./dashboard/tile";

export function GlobalDashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("15d");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [kpis, setKpis] = useState<KPIsResponse | null>(null);
  const [selected, setSelected] = useState<FeedItem | null>(null);
  const [sourcesBreakdown, setSourcesBreakdown] = useState<SourcesBreakdownResponse | null>(null);
  const [jurisdictionsBreakdown, setJurisdictionsBreakdown] = useState<JurisdictionsBreakdownResponse | null>(null);
  const [brief, setBrief] = useState<StatsBriefResponse | null>(null);
  const [compare, setCompare] = useState<ScopeCompareResponse | null>(null);
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null);
  const [momentum, setMomentum] = useState<MomentumResponse | null>(null);
  const [riskIndex, setRiskIndex] = useState<RiskIndexResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const refreshInFlight = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoading = isRefreshing && !kpis && feed.length === 0;

  const otherLocale = locale === "en" ? "fr" : "en";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function refreshData() {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setIsRefreshing(true);
    try {
      const [feedRes, kpiRes, sourcesRes, jurRes, briefRes, compareRes, coverageRes, momentumRes, riskRes, summaryRes] = await Promise.all([
        fetchFeed({
          time_window: timeWindow,
          search: debouncedSearch || undefined,
          page: 1,
          page_size: 50,
        }),
        fetchKpis(),
        fetchSourcesBreakdown(timeWindow),
        fetchJurisdictionsBreakdown(timeWindow),
        fetchBrief(timeWindow),
        fetchCompare(timeWindow),
        fetchCoverage(timeWindow, 8),
        fetchMomentum(timeWindow, 8),
        fetchRiskIndex(timeWindow),
        fetchSummary(timeWindow),
      ]);
      setFeed(feedRes.items.filter((item) => !isCanadaJurisdiction(item.jurisdiction)));
      setKpis(kpiRes);
      setSourcesBreakdown(sourcesRes);
      setJurisdictionsBreakdown(jurRes);
      setBrief(briefRes);
      setCompare(compareRes);
      setCoverage(coverageRes);
      setMomentum(momentumRes);
      setRiskIndex(riskRes);
      setSummary(summaryRes);
    } catch {
      /* ignore */
    } finally {
      setIsRefreshing(false);
      refreshInFlight.current = false;
    }
  }

  useEffect(() => {
    refreshData().catch(() => undefined);
  }, [timeWindow, debouncedSearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        setControlsOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
        return;
      }
      if (!inEditable && key === "/") {
        event.preventDefault();
        setControlsOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
        return;
      }
      if (key === "escape" && selected) setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const topCountries = useMemo(() => {
    return (jurisdictionsBreakdown?.jurisdictions ?? [])
      .filter((item) => !isCanadaJurisdiction(item.name))
      .slice(0, 10);
  }, [jurisdictionsBreakdown]);

  const topCategories = useMemo(() => {
    return (coverage?.categories ?? []).slice(0, 6);
  }, [coverage]);

  const topSourceTypes = useMemo(() => {
    return (coverage?.source_types ?? []).slice(0, 6);
  }, [coverage]);

  const categoryMomentum = useMemo(() => {
    return (momentum?.categories ?? []).slice(0, 6);
  }, [momentum]);

  const refreshTone = isRefreshing ? "pending" : "live";
  const latestSignalDate = feed[0] ? new Date(feed[0].published_at).toLocaleDateString() : "--";

  return (
    <DashboardShell
      locale={locale}
      activeScope="world"
      navLabels={{
        canada: t("nav.canada"),
        world: t("nav.world"),
        methods: t("nav.methods"),
      }}
      otherLocale={otherLocale}
      theme={theme}
      onToggleTheme={toggleTheme}
      headerMeta={(
        <div className="dd-meta-strip">
          <span className={`dd-meta-pill ${refreshTone}`}>
            {isRefreshing ? t("feed.refreshing") : t("feed.live")}
          </span>
          <span className="dd-meta-pill">{t("filters.timeWindow")}: {timeWindow.toUpperCase()}</span>
          <span className="dd-meta-pill">{t("global.latestSignals")}: {feed.length}</span>
        </div>
      )}
      headerActions={(
        <>
          <QuickGuideButton onClick={() => setGuideOpen((prev) => !prev)} />
          <button
            onClick={() => setControlsOpen((prev) => !prev)}
            className={`nav-button ${controlsOpen ? "is-active" : ""}`}
            aria-pressed={controlsOpen}
          >
            {controlsOpen ? t("filters.hideControls") : t("filters.refine")}
          </button>
        </>
      )}
      guidePanel={<QuickGuidePanel isOpen={guideOpen} onClose={() => setGuideOpen(false)} locale={locale} />}
      utilityBar={controlsOpen ? (
        <div className="dd-world-utility mx-auto flex max-w-[1720px] flex-wrap items-center gap-3 px-4 py-2">
          <label className="dd-compact-label">
            <span>{t("filters.timeWindow")}</span>
            <select
              className="dd-compact-select"
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
            >
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="15d">15 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="1y">1 Year</option>
              <option value="2y">2 Years</option>
              <option value="5y">5 Years</option>
            </select>
          </label>
          <div className="dd-compact-search">
            <Search size={14} color="var(--text-muted)" />
            <input
              ref={searchInputRef}
              className="dd-compact-input"
              placeholder={t("filters.keywordPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      ) : null}
    >
      <main className="dd-dashboard-main mx-auto max-w-[1720px] space-y-4 px-4 py-4 md:px-5">
        {/* Hero */}
        <section className="dd-tile dd-world-hero dd-hero-card p-5 md:p-6">
          <p className="dd-hero-eyebrow">{t("global.scopeLabel")}</p>
          <h1 className="dd-hero-title">{t("hero.globalHeadline")}</h1>
          <p className="dd-hero-subtitle mt-2 max-w-3xl text-sm text-textSecondary">
            {t("global.description")}
          </p>
          <div className="dd-hero-stats dd-hero-stats-inline mt-4">
            <div className="dd-hero-chip">
              <span>{t("filters.timeWindow")}</span>
              <strong>{timeWindow.toUpperCase()}</strong>
            </div>
            <div className="dd-hero-chip">
              <span>{t("global.latestSignals")}</span>
              <strong>{feed.length}</strong>
            </div>
            <div className="dd-hero-chip">
              <span>{t("risk.title")}</span>
              <strong>{(riskIndex?.score ?? 0).toFixed(1)}</strong>
            </div>
            <div className="dd-hero-chip">
              <span>{t("feed.lastRefresh")}</span>
              <strong>{latestSignalDate}</strong>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="dd-world-kpis grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          <MetricTile
            label={t("kpi.new15m")}
            value={kpis?.m15.current ?? 0}
            tone={(kpis?.m15.delta_percent ?? 0) >= 0 ? "ok" : "critical"}
            loading={isInitialLoading}
            footer={<Delta value={kpis?.m15.delta_percent ?? 0} />}
          />
          <MetricTile
            label={t("kpi.new1h")}
            value={kpis?.h1.current ?? 0}
            tone={(kpis?.h1.delta_percent ?? 0) >= 0 ? "ok" : "critical"}
            loading={isInitialLoading}
            footer={<Delta value={kpis?.h1.delta_percent ?? 0} />}
          />
          <MetricTile
            label={t("kpi.new7d")}
            value={kpis?.d7.current ?? 0}
            tone={(kpis?.d7.delta_percent ?? 0) >= 0 ? "ok" : "critical"}
            loading={isInitialLoading}
            footer={<Delta value={kpis?.d7.delta_percent ?? 0} />}
          />
          <MetricTile
            label={t("risk.title")}
            value={(riskIndex?.score ?? 0).toFixed(1)}
            tone={riskIndex?.level === "high" ? "critical" : riskIndex?.level === "medium" ? "warn" : "info"}
            loading={isInitialLoading}
            footer={<span className="capitalize">{riskIndex?.level ?? "low"}</span>}
          />
        </section>

        <div className="dd-action-row flex flex-wrap items-center gap-2">
          <button onClick={() => setAnalysisExpanded((prev) => !prev)} className="btn-ghost">
            {analysisExpanded ? t("hero.hideAnalysis") : t("hero.showAnalysis")}
          </button>
        </div>

        {analysisExpanded ? (
          <>
            {/* Signal Summary */}
            <Tile title={t("summary.title")}>
              {(summary?.bullets ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-textMuted">{t("summary.noData")}</p>
              ) : (
                <ul className="mt-3 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-textSecondary">
                  {(summary?.bullets ?? []).map((line) => (<li key={line} className="pl-1">{line}</li>))}
                </ul>
              )}
            </Tile>

            {/* Canada vs Global Comparison */}
            <section className="dd-tile dd-world-compare p-4">
              <h3 className="mb-3 text-sm font-semibold text-textSecondary">{t("compare.title")}</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded border border-borderSoft bg-bg p-3 text-center">
                  <p className="text-xs text-textMuted">{t("compare.canada")}</p>
                  <p className="mt-1 text-2xl font-semibold">{compare?.canada ?? 0}</p>
                </div>
                <div className="rounded border border-borderSoft bg-bg p-3 text-center">
                  <p className="text-xs text-textMuted">{t("compare.global")}</p>
                  <p className="mt-1 text-2xl font-semibold">{compare?.global ?? 0}</p>
                </div>
                <div className="rounded border border-borderSoft bg-bg p-3 text-center">
                  <p className="text-xs text-textMuted">{t("compare.other")}</p>
                  <p className="mt-1 text-2xl font-semibold">{compare?.other ?? 0}</p>
                </div>
              </div>
              {(compare?.categories ?? []).length > 0 && (
                <div className="mt-3 space-y-1 text-xs">
                  {(compare?.categories ?? []).slice(0, 6).map((item) => (
                    <div key={item.name} className="grid grid-cols-3 gap-2 rounded border border-borderSoft px-2 py-1">
                      <span className="capitalize">{item.name}</span>
                      <span>{t("global.canada")}: {item.canada}</span>
                      <span>{t("global.globalLabel")}: {item.global}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Country / Region Rankings */}
            <section className="dd-tile dd-world-rankings p-4">
              <h3 className="mb-3 text-sm font-semibold text-textSecondary">{t("global.topRegions")}</h3>
              <div className="space-y-2">
                {topCountries.map((item, i) => {
                  const total = Math.max(1, jurisdictionsBreakdown?.total ?? 1);
                  const pct = Math.round((item.count / total) * 100);
                  const width = Math.max(6, pct);
                  return (
                    <div key={item.name} className="rounded border border-borderSoft px-3 py-2 text-xs">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">
                          <span className="mr-2 inline-block w-5 text-right text-textMuted">{i + 1}.</span>
                          {item.name}
                        </span>
                        <span className="text-textSecondary">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded bg-bg">
                        <div className="h-1.5 rounded" style={{ width: `${width}%`, background: "var(--primary-action)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="dd-world-breakdowns grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Category Distribution */}
              <section className="dd-tile p-4">
                <h3 className="mb-3 text-sm font-semibold text-textSecondary">{t("global.categoryDistribution")}</h3>
                <div className="space-y-2 text-xs">
                  {topCategories.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded border border-borderSoft px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: categoryColor[item.name] ?? "var(--text-muted)" }}
                        />
                        <span className="capitalize">{item.name}</span>
                      </span>
                      <span className="text-textSecondary">{item.count} ({item.percent.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Source Type Breakdown */}
              <section className="dd-tile p-4">
                <h3 className="mb-3 text-sm font-semibold text-textSecondary">{t("global.sourceTypes")}</h3>
                <div className="space-y-2 text-xs">
                  {topSourceTypes.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded border border-borderSoft px-3 py-2">
                      <span className="capitalize">{item.name}</span>
                      <span className="text-textSecondary">{item.count} ({item.percent.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Category Momentum */}
            <section className="dd-tile dd-world-momentum p-4">
              <h3 className="mb-3 text-sm font-semibold text-textSecondary">{t("global.categoryMomentum")}</h3>
              <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
                {categoryMomentum.map((item) => (
                  <div key={item.name} className="rounded border border-borderSoft bg-bg px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{item.name}</span>
                      <Delta value={item.delta_percent} />
                    </div>
                    <div className="mt-1 text-textMuted">
                      {item.current} now vs {item.previous} prev ({item.change >= 0 ? "+" : ""}{item.change})
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
        {/* Latest Global Signals */}
        <section className="dd-tile dd-world-feed p-4">
          <h3 className="mb-3 text-sm font-semibold text-textSecondary">{t("global.latestSignals")}</h3>
          <div className="space-y-2">
            {feed.slice(0, 20).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="dd-signal-row block w-full rounded border border-borderSoft px-3 py-2 text-left text-xs transition-all hover:shadow-sm"
                style={{ borderLeftColor: categoryColor[item.category] ?? "var(--border-soft)", borderLeftWidth: 3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="line-clamp-1 font-medium text-text">{item.title}</span>
                  <span className="ml-2 shrink-0 text-textMuted">{item.jurisdiction}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-textMuted">
                  <span>{item.publisher}</span>
                  <span className="capitalize">{item.category}</span>
                  <span>{new Date(item.published_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
            {feed.length === 0 && !isRefreshing && (
              <p className="py-4 text-center text-sm text-textMuted">{t("global.noSignals")}</p>
            )}
          </div>
        </section>
      </main>

      {/* Detail Modal */}
      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)} />
      )}
    </DashboardShell>
  );
}


