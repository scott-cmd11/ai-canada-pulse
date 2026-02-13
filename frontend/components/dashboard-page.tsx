"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Globe2, Landmark, Moon, Search, Sun } from "lucide-react";

import {
  fetchAlerts,
  fetchCoverage,
  fetchEntitiesBreakdown,
  fetchTagsBreakdown,
  executeSyntheticPurge,
  exportUrl,
  fetchBackfillStatus,
  fetchBrief,
  fetchCompare,
  fetchConcentration,
  fetchConfidence,
  fetchEntityMomentum,
  fetchMomentum,
  fetchRiskTrend,
  fetchRiskIndex,
  fetchSummary,
  fetchFeed,
  fetchHourly,
  fetchJurisdictionsBreakdown,
  fetchKpis,
  fetchSourcesBreakdown,
  fetchSourcesHealth,
  fetchWeekly,
  previewSyntheticPurge,
  runBackfill,
  sseUrl,
} from "../lib/api";
import type {
  BackfillStatus,
  EChartsResponse,
  EntitiesBreakdownResponse,
  FeedItem,
  StatsAlertItem,
  StatsBriefResponse,
  ScopeCompareResponse,
  CoverageResponse,
  ConfidenceProfileResponse,
  ConcentrationResponse,
  MomentumResponse,
  RiskIndexResponse,
  EntityMomentumResponse,
  RiskTrendResponse,
  SummaryResponse,
  KPIsResponse,
  PurgeSyntheticResponse,
  SourceHealthEntry,
  SourcesBreakdownResponse,
  TimeWindow,
  TagsBreakdownResponse,
} from "../lib/types";
import type { JurisdictionsBreakdownResponse } from "../lib/types";
import { useMode } from "./mode-provider";
import { useTheme } from "./theme-provider";

const EChartsReact = dynamic(() => import("echarts-for-react"), { ssr: false });

const categoryColor: Record<string, string> = {
  policy: "var(--policy)",
  research: "var(--research)",
  industry: "var(--industry)",
  funding: "var(--funding)",
  news: "var(--news)",
  incidents: "var(--incidents)",
};

type FilterPreset = {
  id: string;
  name: string;
  timeWindow: TimeWindow;
  category: string;
  jurisdiction: string;
  language: string;
  search: string;
};

type ScenarioPreset = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  mode: "policy" | "research";
  timeWindow: TimeWindow;
  category: string;
  jurisdiction: string;
  language: string;
  search: string;
};

type SavedBrief = {
  id: string;
  createdAt: string;
  markdown: string;
};

function Delta({ value }: { value: number }) {
  const positive = value >= 0;
  return <span style={{ color: positive ? "var(--research)" : "var(--incidents)" }}>{positive ? "+" : ""}{value.toFixed(1)}%</span>;
}

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="h-3 animate-pulse rounded bg-bg" style={{ width }} />;
}

function RelativeTime({ value }: { value: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const render = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
      if (seconds < 60) return setLabel(`${seconds}s ago`);
      if (seconds < 3600) return setLabel(`${Math.floor(seconds / 60)}m ago`);
      if (seconds < 86400) return setLabel(`${Math.floor(seconds / 3600)}h ago`);
      return setLabel(`${Math.floor(seconds / 86400)}d ago`);
    };
    render();
    const timer = setInterval(render, 30000);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{label}</span>;
}

export function DashboardPage({ scope }: { scope: "canada" | "world" }) {
  const t = useTranslations();
  const locale = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { mode, setMode } = useMode();
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h");
  const [category, setCategory] = useState("");
  const [jurisdiction, setJurisdiction] = useState(scope === "canada" ? "Canada" : "Global");
  const [language, setLanguage] = useState("");
  const [search, setSearch] = useState("");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [kpis, setKpis] = useState<KPIsResponse | null>(null);
  const [hourly, setHourly] = useState<EChartsResponse | null>(null);
  const [weekly, setWeekly] = useState<EChartsResponse | null>(null);
  const [selected, setSelected] = useState<FeedItem | null>(null);
  const [backfillStatus, setBackfillStatus] = useState<BackfillStatus | null>(null);
  const [backfillStartDate, setBackfillStartDate] = useState("2022-11-01");
  const [backfillEndDate, setBackfillEndDate] = useState("");
  const [backfillPerPage, setBackfillPerPage] = useState(50);
  const [backfillPagesPerMonth, setBackfillPagesPerMonth] = useState(1);
  const [isBackfillRunning, setIsBackfillRunning] = useState(false);
  const [isBackfillSubmitting, setIsBackfillSubmitting] = useState(false);
  const [backfillError, setBackfillError] = useState("");
  const [cleanupStatus, setCleanupStatus] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [cleanupResult, setCleanupResult] = useState<PurgeSyntheticResponse | null>(null);
  const [sourceHealth, setSourceHealth] = useState<SourceHealthEntry[]>([]);
  const [sourceHealthUpdatedAt, setSourceHealthUpdatedAt] = useState("");
  const [sourceHealthRunStatus, setSourceHealthRunStatus] = useState("");
  const [sourceHealthInsertedTotal, setSourceHealthInsertedTotal] = useState(0);
  const [sourceHealthCandidatesTotal, setSourceHealthCandidatesTotal] = useState(0);
  const [sourceHealthSkippedLockCount, setSourceHealthSkippedLockCount] = useState(0);
  const [sourcesBreakdown, setSourcesBreakdown] = useState<SourcesBreakdownResponse | null>(null);
  const [jurisdictionsBreakdown, setJurisdictionsBreakdown] = useState<JurisdictionsBreakdownResponse | null>(null);
  const [entitiesBreakdown, setEntitiesBreakdown] = useState<EntitiesBreakdownResponse | null>(null);
  const [tagsBreakdown, setTagsBreakdown] = useState<TagsBreakdownResponse | null>(null);
  const [alerts, setAlerts] = useState<StatsAlertItem[]>([]);
  const [brief, setBrief] = useState<StatsBriefResponse | null>(null);
  const [compare, setCompare] = useState<ScopeCompareResponse | null>(null);
  const [confidenceProfile, setConfidenceProfile] = useState<ConfidenceProfileResponse | null>(null);
  const [concentration, setConcentration] = useState<ConcentrationResponse | null>(null);
  const [momentum, setMomentum] = useState<MomentumResponse | null>(null);
  const [riskIndex, setRiskIndex] = useState<RiskIndexResponse | null>(null);
  const [entityMomentum, setEntityMomentum] = useState<EntityMomentumResponse | null>(null);
  const [riskTrend, setRiskTrend] = useState<RiskTrendResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null);
  const [sseStatus, setSseStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [lastLiveAt, setLastLiveAt] = useState("");
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [panelVisibility, setPanelVisibility] = useState<Record<string, boolean>>({
    backfill: true,
    cleanup: true,
    sourceHealth: true,
    sourceFreshness: true,
    sourceMix: true,
    coverageMatrix: true,
    sourceQuality: true,
    confidenceProfile: true,
    riskTrend: true,
    momentum: true,
    entityMomentum: true,
    pinnedSignals: true,
    briefHistory: true,
    alerts: true,
    alertCenter: true,
    jurisdictions: true,
    entities: true,
    tags: true,
    hourly: true,
    weekly: true,
  });
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [briefCopyState, setBriefCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [saveBriefState, setSaveBriefState] = useState<"idle" | "saved">("idle");
  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");
  const [nowTs, setNowTs] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState("");
  const [autoRefreshSec, setAutoRefreshSec] = useState<0 | 15 | 30 | 60>(30);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [feedSort, setFeedSort] = useState<"newest" | "confidence">("newest");
  const [pinnedItems, setPinnedItems] = useState<FeedItem[]>([]);
  const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const isInitialLoading = isRefreshing && !kpis && feed.length === 0;

  const scenarioPresets: ScenarioPreset[] = useMemo(
    () => [
      {
        id: "policy-pulse",
        labelKey: "policyPulse",
        descriptionKey: "policyPulseDesc",
        mode: "policy",
        timeWindow: "7d",
        category: "policy",
        jurisdiction: scope === "canada" ? "Canada" : "",
        language: "",
        search: "bill regulation consultation ministry parliament",
      },
      {
        id: "research-surge",
        labelKey: "researchSurge",
        descriptionKey: "researchSurgeDesc",
        mode: "research",
        timeWindow: "24h",
        category: "research",
        jurisdiction: "",
        language: "",
        search: "openalex paper model benchmark",
      },
      {
        id: "risk-watch",
        labelKey: "riskWatch",
        descriptionKey: "riskWatchDesc",
        mode: "research",
        timeWindow: "24h",
        category: "incidents",
        jurisdiction: "",
        language: "",
        search: "safety incident lawsuit concern harmful",
      },
      {
        id: "canada-focus",
        labelKey: "canadaFocus",
        descriptionKey: "canadaFocusDesc",
        mode: "research",
        timeWindow: "7d",
        category: "",
        jurisdiction: "Canada",
        language: "",
        search: "",
      },
      {
        id: "global-sweep",
        labelKey: "globalSweep",
        descriptionKey: "globalSweepDesc",
        mode: "research",
        timeWindow: "7d",
        category: "",
        jurisdiction: "Global",
        language: "",
        search: "",
      },
    ],
    [scope]
  );

  const otherLocale = locale === "en" ? "fr" : "en";
  const pagePath = scope === "canada" ? "canada" : "world";

  async function refreshData() {
    setIsRefreshing(true);
    try {
      const [feedResponse, kpiResponse, hourlyResponse, weeklyResponse, jurisdictionsResponse, briefResponse, compareResponse, confidenceResponse, concentrationResponse, momentumResponse, riskResponse, entityMomentumResponse, riskTrendResponse, summaryResponse, coverageResponse] = await Promise.all([
        fetchFeed({
          time_window: timeWindow,
          category: category || undefined,
          jurisdiction: jurisdiction || undefined,
          language: language || undefined,
          search: search || undefined,
          page: 1,
          page_size: 50,
        }),
        fetchKpis(),
        fetchHourly(),
        fetchWeekly(),
        fetchJurisdictionsBreakdown(timeWindow),
        fetchBrief(timeWindow),
        fetchCompare(timeWindow),
        fetchConfidence(timeWindow),
      fetchConcentration(timeWindow),
      fetchMomentum(timeWindow, 8),
      fetchRiskIndex(timeWindow),
      fetchEntityMomentum(timeWindow, 10),
      fetchRiskTrend(timeWindow),
      fetchSummary(timeWindow),
      fetchCoverage(timeWindow, 8),
    ]);
      setFeed(feedResponse.items);
      setKpis(kpiResponse);
      setHourly(hourlyResponse);
      setWeekly(weeklyResponse);
      setJurisdictionsBreakdown(jurisdictionsResponse);
      setBrief(briefResponse);
      setCompare(compareResponse);
      setConfidenceProfile(confidenceResponse);
      setConcentration(concentrationResponse);
      setMomentum(momentumResponse);
      setRiskIndex(riskResponse);
      setEntityMomentum(entityMomentumResponse);
      setRiskTrend(riskTrendResponse);
      setSummary(summaryResponse);
      setCoverage(coverageResponse);
      setLastRefreshAt(new Date().toISOString());
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    refreshData().catch(() => undefined);
  }, [timeWindow, category, jurisdiction, language, search]);

  useEffect(() => {
    if (autoRefreshSec === 0) return;
    const timer = setInterval(() => {
      refreshData().catch(() => undefined);
    }, autoRefreshSec * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshSec, timeWindow, category, jurisdiction, language, search]);

  useEffect(() => {
    setSseStatus("connecting");
    const source = new EventSource(sseUrl());
    source.onopen = () => {
      setSseStatus("live");
    };
    source.onerror = () => {
      setSseStatus("error");
    };
    const handler = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as FeedItem;
        if (scope === "canada" && payload.jurisdiction !== "Canada") return;
        if (scope === "world" && payload.jurisdiction === "Canada") return;
        setSseStatus("live");
        setLastLiveAt(new Date().toISOString());
        setFeed((prev) => [payload, ...prev].slice(0, 100));
      } catch {
        return;
      }
    };
    source.addEventListener("new_item", handler);
    return () => source.close();
  }, [scope]);

  useEffect(() => {
    if (mode !== "research") return;

    let mounted = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const poll = async () => {
      try {
        const [status, sources, breakdown, jurisdictions, entities, tags, alertsResponse] = await Promise.all([
          fetchBackfillStatus(),
          fetchSourcesHealth(),
          fetchSourcesBreakdown(timeWindow),
          fetchJurisdictionsBreakdown(timeWindow),
          fetchEntitiesBreakdown(timeWindow),
          fetchTagsBreakdown(timeWindow),
          fetchAlerts(timeWindow),
        ]);
        if (!mounted) return;
        setBackfillStatus(status);
        setIsBackfillRunning(status.state === "running");
        setSourceHealth(sources.sources ?? []);
        setSourceHealthUpdatedAt(sources.updated_at ?? "");
        setSourceHealthRunStatus(sources.run_status ?? "");
        setSourceHealthInsertedTotal(sources.inserted_total ?? 0);
        setSourceHealthCandidatesTotal(sources.candidates_total ?? 0);
        setSourceHealthSkippedLockCount(sources.skipped_lock_count ?? 0);
        setSourcesBreakdown(breakdown);
        setJurisdictionsBreakdown(jurisdictions);
        setEntitiesBreakdown(entities);
        setTagsBreakdown(tags);
        setAlerts(alertsResponse.alerts ?? []);
      } catch {
        if (!mounted) return;
        setBackfillError("Unable to fetch backfill status.");
      }
    };

    poll().catch(() => undefined);
    timer = setInterval(() => {
      poll().catch(() => undefined);
    }, 5000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [mode, timeWindow]);

  useEffect(() => {
    if (mode !== "research") return;
    try {
      const raw = localStorage.getItem("research_panel_visibility");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      setPanelVisibility((prev) => ({ ...prev, ...parsed }));
    } catch {
      return;
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "research") return;
    localStorage.setItem("research_panel_visibility", JSON.stringify(panelVisibility));
  }, [mode, panelVisibility]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`dashboard_presets_${scope}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as FilterPreset[];
      if (Array.isArray(parsed)) setPresets(parsed.slice(0, 8));
    } catch {
      return;
    }
  }, [scope]);

  useEffect(() => {
    localStorage.setItem(`dashboard_presets_${scope}`, JSON.stringify(presets));
  }, [presets, scope]);

  useEffect(() => {
    if (!selected) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected]);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard_density");
      if (raw === "compact" || raw === "comfortable") {
        setDensity(raw);
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("dashboard_density", density);
  }, [density]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard_feed_sort");
      if (raw === "newest" || raw === "confidence") {
        setFeedSort(raw);
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("dashboard_feed_sort", feedSort);
  }, [feedSort]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard_auto_refresh_sec");
      const parsed = Number(raw);
      if (parsed === 0 || parsed === 15 || parsed === 30 || parsed === 60) {
        setAutoRefreshSec(parsed);
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("dashboard_auto_refresh_sec", String(autoRefreshSec));
  }, [autoRefreshSec]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`pinned_signals_${scope}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as FeedItem[];
      if (Array.isArray(parsed)) setPinnedItems(parsed.slice(0, 30));
    } catch {
      return;
    }
  }, [scope]);

  useEffect(() => {
    localStorage.setItem(`pinned_signals_${scope}`, JSON.stringify(pinnedItems));
  }, [pinnedItems, scope]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`saved_briefs_${scope}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedBrief[];
      if (Array.isArray(parsed)) setSavedBriefs(parsed.slice(0, 20));
    } catch {
      return;
    }
  }, [scope]);

  useEffect(() => {
    localStorage.setItem(`saved_briefs_${scope}`, JSON.stringify(savedBriefs));
  }, [savedBriefs, scope]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`dismissed_alerts_${scope}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) setDismissedAlertIds(parsed.slice(0, 200));
    } catch {
      return;
    }
  }, [scope]);

  useEffect(() => {
    localStorage.setItem(`dismissed_alerts_${scope}`, JSON.stringify(dismissedAlertIds));
  }, [dismissedAlertIds, scope]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tw = params.get("tw");
    const cat = params.get("cat");
    const jur = params.get("jur");
    const lang = params.get("lang");
    const q = params.get("q");
    const m = params.get("m");
    if (tw === "1h" || tw === "24h" || tw === "7d" || tw === "30d") setTimeWindow(tw);
    if (cat) setCategory(cat);
    if (jur) setJurisdiction(jur);
    if (lang) setLanguage(lang);
    if (q) setSearch(q);
    if (m === "policy" || m === "research") setMode(m);
  }, [setMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    params.set("tw", timeWindow);
    if (category) params.set("cat", category);
    if (jurisdiction) params.set("jur", jurisdiction);
    if (language) params.set("lang", language);
    if (search) params.set("q", search);
    params.set("m", mode);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", next);
  }, [timeWindow, category, jurisdiction, language, search, mode]);

  const topInsights = useMemo(() => {
    const counts = new Map<string, number>();
    feed.forEach((item) => {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, count]) => `${cat}: ${count}`);
  }, [feed]);

  const sortedFeed = useMemo(() => {
    const next = [...feed];
    if (feedSort === "confidence") {
      next.sort((a, b) => b.confidence - a.confidence);
      return next;
    }
    next.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    return next;
  }, [feed, feedSort]);

  const executivePulse = useMemo(() => {
    const insights: string[] = [];
    const topCategory = topInsights[0];
    if (topCategory) insights.push(`${t("pulse.leadCategory")} ${topCategory}.`);
    if (alerts.length > 0) {
      const strongest = alerts[0];
      const direction = strongest.direction === "up" ? t("pulse.rising") : t("pulse.falling");
      insights.push(
        `${t("pulse.strongestSignal")} ${strongest.category} ${direction} ${Math.abs(strongest.delta_percent).toFixed(1)}%.`
      );
    } else {
      insights.push(t("pulse.noMajorShifts"));
    }
    const topJurisdiction = jurisdictionsBreakdown?.jurisdictions?.[0];
    if (topJurisdiction) insights.push(`${t("pulse.topJurisdiction")} ${topJurisdiction.name} (${topJurisdiction.count}).`);
    return insights.slice(0, 3);
  }, [alerts, jurisdictionsBreakdown?.jurisdictions, t, topInsights]);

  const strategicNarrative = useMemo(() => {
    const lines: string[] = [];
    const d7 = kpis?.d7;
    if (d7) {
      const direction = d7.delta_percent >= 0 ? t("narrative.accelerating") : t("narrative.cooling");
      lines.push(`${t("narrative.momentum")} ${direction} (${d7.delta_percent.toFixed(1)}%).`);
    }
    const highAlert = alerts.find((item) => item.severity === "high");
    if (highAlert) {
      const move = highAlert.direction === "up" ? t("narrative.spike") : t("narrative.drop");
      lines.push(`${t("narrative.risk")} ${highAlert.category} ${move} ${Math.abs(highAlert.delta_percent).toFixed(1)}%.`);
    }
    const topPublisher = sourcesBreakdown?.publishers?.[0];
    if (topPublisher && (sourcesBreakdown?.total ?? 0) > 0) {
      const share = ((topPublisher.count / Math.max(1, sourcesBreakdown.total)) * 100).toFixed(1);
      lines.push(`${t("narrative.sourceConcentration")} ${topPublisher.name} (${share}%).`);
    }
    const topTag = tagsBreakdown?.tags?.[0];
    if (topTag) {
      lines.push(`${t("narrative.theme")} ${topTag.name} (${topTag.count}).`);
    }
    return lines.slice(0, 4);
  }, [alerts, kpis?.d7, sourcesBreakdown, tagsBreakdown, t]);

  const sourceQuality = useMemo(() => {
    return (sourceHealth ?? [])
      .map((src) => {
        const fetched = Math.max(1, src.fetched || 0);
        const accepted = Math.max(0, src.accepted || 0);
        const inserted = Math.max(0, src.inserted || 0);
        const duplicates = Math.max(0, src.duplicates || 0);
        const writeErrors = Math.max(0, src.write_errors || 0);
        const acceptance = accepted / fetched;
        const insertEfficiency = inserted / Math.max(1, accepted);
        const duplicatePenalty = Math.min(0.35, duplicates / fetched);
        const errorPenalty = Math.min(0.45, (writeErrors / fetched) * 2);
        const statusBoost = src.status === "ok" ? 0.1 : 0.0;
        const raw = (acceptance * 0.45 + insertEfficiency * 0.45 + statusBoost - duplicatePenalty - errorPenalty) * 100;
        const score = Math.max(0, Math.min(100, Math.round(raw)));
        const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : "D";
        return { ...src, score, grade };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [sourceHealth]);

  const sourceFreshness = useMemo(() => {
    return (sourceHealth ?? [])
      .map((src) => {
        const last = src.last_run ? new Date(src.last_run).getTime() : 0;
        const minutes = last > 0 ? Math.max(0, Math.floor((nowTs - last) / 60000)) : 9999;
        const level = minutes > 60 ? "stale" : minutes > 20 ? "aging" : "fresh";
        return { ...src, minutes, level };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }, [sourceHealth, nowTs]);

  const coverageGroups = useMemo(
    () => [
      { key: "categories", label: t("coverage.categories"), rows: coverage?.categories ?? [] },
      { key: "source_types", label: t("coverage.sourceTypes"), rows: coverage?.source_types ?? [] },
      { key: "languages", label: t("coverage.languages"), rows: coverage?.languages ?? [] },
      { key: "jurisdictions", label: t("coverage.jurisdictions"), rows: coverage?.jurisdictions ?? [] },
    ],
    [coverage, t]
  );

  const alertCenterItems = useMemo(() => {
    const items: Array<{ id: string; severity: "high" | "medium"; message: string }> = [];
    alerts
      .filter((item) => item.severity === "high")
      .forEach((item) => {
        const id = `trend-${item.category}-${item.direction}`;
        const msg = `${t("alerts.title")}: ${item.category} ${item.direction === "up" ? t("alerts.spike") : t("alerts.drop")} ${item.delta_percent.toFixed(1)}%`;
        items.push({ id, severity: "high", message: msg });
      });
    sourceFreshness
      .filter((item) => item.level === "stale")
      .forEach((item) => {
        const id = `stale-${item.source}`;
        const msg = `${t("sources.freshnessTitle")}: ${item.source} ${item.minutes}m`;
        items.push({ id, severity: "medium", message: msg });
      });
    (riskIndex?.reasons ?? [])
      .filter((reason) => reason !== "stable_signal_profile")
      .forEach((reason) => {
        const id = `risk-${reason}`;
        const msg = `${t("risk.title")}: ${t(`riskReason.${reason}`)}`;
        items.push({ id, severity: "high", message: msg });
      });
    return items.filter((item) => !dismissedAlertIds.includes(item.id)).slice(0, 20);
  }, [alerts, sourceFreshness, riskIndex?.reasons, dismissedAlertIds, t]);

  const confidenceTone: Record<string, string> = {
    very_high: "var(--research)",
    high: "var(--policy)",
    medium: "var(--warning)",
    low: "var(--incidents)",
  };

  function concentrationTone(level: string): string {
    if (level === "high") return "var(--incidents)";
    if (level === "medium") return "var(--warning)";
    return "var(--research)";
  }

  function applyCoverageFilter(groupKey: string, value: string) {
    if (groupKey === "categories") {
      setCategory(value);
    } else if (groupKey === "jurisdictions") {
      setJurisdiction(value);
    } else if (groupKey === "languages") {
      setLanguage(value);
    } else if (groupKey === "source_types") {
      setSearch(value);
    }
    setMode("research");
  }

  const hourlyOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-soft)",
        borderWidth: 1,
        textStyle: { color: "var(--text)" },
      },
      legend: { data: hourly?.legend ?? [], textStyle: { color: "var(--text-secondary)" } },
      xAxis: { type: "category", data: hourly?.xAxis ?? [], axisLabel: { color: "var(--text-muted)" } },
      yAxis: { type: "value", axisLabel: { color: "var(--text-muted)" } },
      series: (hourly?.series ?? []).map((item) => ({
        ...item,
        smooth: true,
        lineStyle: { color: categoryColor[item.name] ?? "var(--text-secondary)" },
        areaStyle: { opacity: 0.12, color: categoryColor[item.name] ?? "var(--text-secondary)" },
      })),
    }),
    [hourly]
  );

  const weeklyOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-soft)",
        borderWidth: 1,
        textStyle: { color: "var(--text)" },
      },
      legend: { data: weekly?.legend ?? [], textStyle: { color: "var(--text-secondary)" } },
      xAxis: { type: "category", data: weekly?.xAxis ?? [], axisLabel: { color: "var(--text-muted)" } },
      yAxis: { type: "value", axisLabel: { color: "var(--text-muted)" } },
      series: (weekly?.series ?? []).map((item) => ({
        ...item,
        itemStyle: { color: categoryColor[item.name] ?? "var(--text-secondary)" },
      })),
    }),
    [weekly]
  );

  const riskTrendOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-soft)",
        borderWidth: 1,
        textStyle: { color: "var(--text)" },
      },
      legend: { data: [t("riskTrend.score"), t("riskTrend.incidents"), t("riskTrend.lowConfidence")], textStyle: { color: "var(--text-secondary)" } },
      xAxis: { type: "category", data: riskTrend?.xAxis ?? [], axisLabel: { color: "var(--text-muted)" } },
      yAxis: { type: "value", axisLabel: { color: "var(--text-muted)" } },
      series: [
        {
          name: t("riskTrend.score"),
          type: "line",
          smooth: true,
          data: riskTrend?.risk_score ?? [],
          lineStyle: { color: "var(--incidents)" },
        },
        {
          name: t("riskTrend.incidents"),
          type: "line",
          smooth: true,
          data: riskTrend?.incidents_ratio_pct ?? [],
          lineStyle: { color: "var(--warning)" },
        },
        {
          name: t("riskTrend.lowConfidence"),
          type: "line",
          smooth: true,
          data: riskTrend?.low_confidence_ratio_pct ?? [],
          lineStyle: { color: "var(--policy)" },
        },
      ],
    }),
    [riskTrend, t]
  );

  async function startBackfill() {
    setIsBackfillSubmitting(true);
    setBackfillError("");
    try {
      const response = await runBackfill({
        start_date: backfillStartDate,
        end_date: backfillEndDate || undefined,
        per_page: backfillPerPage,
        max_pages_per_month: backfillPagesPerMonth,
      });
      setIsBackfillRunning(true);
      setBackfillStatus((prev) => ({
        ...(prev ?? {}),
        state: "running",
      }));
      if (response.status !== "queued") {
        setBackfillError("Backfill request not queued.");
      }
    } catch {
      setBackfillError("Backfill request failed.");
    } finally {
      setIsBackfillSubmitting(false);
    }
  }

  const backfillStateLabel = useMemo(() => {
    const key = backfillStatus?.state ?? "idle";
    if (key === "running") return t("backfill.running");
    if (key === "completed") return t("backfill.completed");
    if (key === "failed") return t("backfill.failed");
    if (key === "queued") return t("backfill.queued");
    return t("backfill.idle");
  }, [backfillStatus?.state, t]);

  const cleanupStateLabel = useMemo(() => {
    if (cleanupStatus === "running") return t("cleanup.running");
    if (cleanupStatus === "done") return t("cleanup.done");
    if (cleanupStatus === "failed") return t("cleanup.failed");
    return t("cleanup.idle");
  }, [cleanupStatus, t]);

  async function previewCleanup() {
    setCleanupStatus("running");
    try {
      const result = await previewSyntheticPurge();
      setCleanupResult(result);
      setCleanupStatus("done");
    } catch {
      setCleanupStatus("failed");
    }
  }

  async function runCleanup() {
    setCleanupStatus("running");
    try {
      const result = await executeSyntheticPurge();
      setCleanupResult(result);
      setCleanupStatus("done");
      await refreshData();
    } catch {
      setCleanupStatus("failed");
    }
  }

  function togglePanel(panel: string) {
    setPanelVisibility((prev) => ({ ...prev, [panel]: !prev[panel] }));
  }

  function savePreset() {
    const name = window.prompt(t("filters.presetNamePrompt"), "");
    if (!name) return;
    const next: FilterPreset = {
      id: `${Date.now()}`,
      name: name.trim(),
      timeWindow,
      category,
      jurisdiction,
      language,
      search,
    };
    setPresets((prev) => [next, ...prev].slice(0, 8));
  }

  function applyPreset(preset: FilterPreset) {
    setTimeWindow(preset.timeWindow);
    setCategory(preset.category);
    setJurisdiction(preset.jurisdiction);
    setLanguage(preset.language);
    setSearch(preset.search);
  }

  function clearFilters() {
    setTimeWindow("24h");
    setCategory("");
    setJurisdiction(scope === "canada" ? "Canada" : "Global");
    setLanguage("");
    setSearch("");
  }

  const activeFilters = useMemo(() => {
    const chips: Array<{ id: string; label: string; clear: () => void }> = [];
    chips.push({ id: "tw", label: `${t("filters.timeWindow")}: ${timeWindow}`, clear: () => setTimeWindow("24h") });
    if (category) chips.push({ id: "cat", label: `${t("filters.category")}: ${category}`, clear: () => setCategory("") });
    if (jurisdiction) chips.push({ id: "jur", label: `${t("filters.region")}: ${jurisdiction}`, clear: () => setJurisdiction(scope === "canada" ? "Canada" : "Global") });
    if (language) chips.push({ id: "lang", label: `${t("feed.language")}: ${language.toUpperCase()}`, clear: () => setLanguage("") });
    if (search) chips.push({ id: "q", label: `${t("filters.keyword")}: ${search}`, clear: () => setSearch("") });
    chips.push({ id: "sort", label: `${t("feed.sort")}: ${feedSort === "newest" ? t("feed.sortNewest") : t("feed.sortConfidence")}`, clear: () => setFeedSort("newest") });
    return chips;
  }, [t, timeWindow, category, jurisdiction, scope, language, search, feedSort]);

  function deletePreset(id: string) {
    setPresets((prev) => prev.filter((item) => item.id !== id));
  }

  function applyScenario(scenario: ScenarioPreset) {
    setMode(scenario.mode);
    setTimeWindow(scenario.timeWindow);
    setCategory(scenario.category);
    setJurisdiction(scenario.jurisdiction);
    setLanguage(scenario.language);
    setSearch(scenario.search);
  }

  function isPinned(id: string): boolean {
    return pinnedItems.some((item) => item.id === id);
  }

  function togglePin(item: FeedItem) {
    setPinnedItems((prev) => {
      const exists = prev.some((entry) => entry.id === item.id);
      if (exists) return prev.filter((entry) => entry.id !== item.id);
      return [item, ...prev].slice(0, 30);
    });
  }

  function applyCategoryFilter(value: string | undefined) {
    if (!value) return;
    const normalized = value.toLowerCase();
    if (["policy", "research", "industry", "funding", "news", "incidents"].includes(normalized)) {
      setCategory(normalized);
      setMode("research");
    }
  }

  const chartEvents = useMemo(
    () => ({
      click: (params: { seriesName?: string }) => {
        applyCategoryFilter(params.seriesName);
      },
    }),
    []
  );

  async function copySelectedUrl() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.url);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("failed");
      setTimeout(() => setCopyState("idle"), 1500);
    }
  }

  const morningBriefMarkdown = useMemo(() => {
    const lines: string[] = [];
    lines.push(`# ${scope === "canada" ? "Canada" : "World"} AI Pulse Brief`);
    lines.push(`- Window: ${timeWindow}`);
    lines.push(`- Generated: ${new Date().toISOString()}`);
    lines.push("");
    lines.push("## Momentum");
    lines.push(`- New items 15m: ${kpis?.m15.current ?? 0} (${(kpis?.m15.delta_percent ?? 0).toFixed(1)}%)`);
    lines.push(`- New items 1h: ${kpis?.h1.current ?? 0} (${(kpis?.h1.delta_percent ?? 0).toFixed(1)}%)`);
    lines.push(`- New items 7d: ${kpis?.d7.current ?? 0} (${(kpis?.d7.delta_percent ?? 0).toFixed(1)}%)`);
    lines.push("");
    lines.push("## Snapshot");
    lines.push(`- Total items: ${brief?.total_items ?? 0}`);
    lines.push(`- Top category: ${brief?.top_category?.name || "-"}`);
    lines.push(`- Top jurisdiction: ${brief?.top_jurisdiction?.name || "-"}`);
    lines.push(`- Top publisher: ${brief?.top_publisher?.name || "-"}`);
    lines.push(`- High alerts: ${brief?.high_alert_count ?? 0}`);
    lines.push("");
    lines.push("## Scope Compare");
    lines.push(`- Canada: ${compare?.canada ?? 0}`);
    lines.push(`- Global: ${compare?.global ?? 0}`);
    lines.push(`- Other: ${compare?.other ?? 0}`);
    lines.push("");
    lines.push("## Pinned Signals");
    if (pinnedItems.length > 0) {
      pinnedItems.slice(0, 5).forEach((item) => {
        lines.push(`- ${item.title} (${item.publisher})`);
        lines.push(`  - ${item.url}`);
      });
    } else {
      lines.push("- none");
    }
    lines.push("");
    const staleSources = sourceFreshness.filter((s) => s.level === "stale");
    lines.push("## Source Freshness");
    lines.push(`- Freshness stale count: ${staleSources.length}`);
    if (staleSources.length > 0) {
      staleSources.slice(0, 3).forEach((src) => {
        lines.push(`  - ${src.source}: ${src.minutes}m since last run`);
      });
    }
    lines.push("");
    lines.push("## Alert Center");
    lines.push(`- Active triage items: ${alertCenterItems.length}`);
    lines.push("");
    lines.push("## Risk");
    lines.push(`- Risk index: ${(riskIndex?.score ?? 0).toFixed(1)} (${riskIndex?.level ?? "low"})`);
    lines.push(
      `- Concentration (combined): ${(concentration?.combined_hhi ?? 0).toFixed(3)} (${concentration?.combined_level ?? "low"})`
    );
    lines.push(`- Confidence average: ${(confidenceProfile?.average_confidence ?? 0).toFixed(2)}`);
    if (alerts.length > 0) {
      lines.push("- Top alerts:");
      alerts.slice(0, 3).forEach((item) => {
        lines.push(`  - ${item.category} ${item.direction} ${item.delta_percent.toFixed(1)}%`);
      });
    } else {
      lines.push("- Top alerts: none");
    }
    return lines.join("\n");
  }, [scope, timeWindow, kpis, brief, compare, concentration, confidenceProfile, riskIndex, alerts, sourceFreshness, alertCenterItems.length, pinnedItems]);

  async function copyMorningBrief() {
    try {
      await navigator.clipboard.writeText(morningBriefMarkdown);
      setBriefCopyState("copied");
      setTimeout(() => setBriefCopyState("idle"), 1600);
    } catch {
      setBriefCopyState("failed");
      setTimeout(() => setBriefCopyState("idle"), 1600);
    }
  }

  function downloadMorningBrief() {
    downloadBrief(morningBriefMarkdown);
  }

  function downloadBrief(markdown: string, stamp?: string) {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const prefix = scope === "canada" ? "canada" : "world";
    const datePart = stamp ? stamp.slice(0, 10) : new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `${prefix}-ai-pulse-brief-${datePart}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function copyBrief(markdown: string) {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      return;
    }
  }

  function saveCurrentBrief() {
    const entry: SavedBrief = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      markdown: morningBriefMarkdown,
    };
    setSavedBriefs((prev) => [entry, ...prev].slice(0, 20));
    setSaveBriefState("saved");
    setTimeout(() => setSaveBriefState("idle"), 1600);
  }

  function dismissAlertItem(id: string) {
    setDismissedAlertIds((prev) => (prev.includes(id) ? prev : [id, ...prev].slice(0, 200)));
  }

  function resetDismissedAlerts() {
    setDismissedAlertIds([]);
  }

  async function copyShareLink() {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 1600);
    } catch {
      setShareState("failed");
      setTimeout(() => setShareState("idle"), 1600);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-borderSoft bg-surface">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/${locale}/canada`} className="inline-flex items-center gap-1"><Landmark size={16} />{t("nav.canada")}</Link>
            <Link href={`/${locale}/world`} className="inline-flex items-center gap-1"><Globe2 size={16} />{t("nav.world")}</Link>
            <Link href={`/${locale}/methods`} className="inline-flex items-center gap-1"><BarChart3 size={16} />{t("nav.methods")}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="rounded border border-borderSoft px-3 py-2 text-sm" aria-label="Toggle theme">
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <Link href={`/${otherLocale}/${pagePath}`} className="rounded border border-borderSoft px-3 py-2 text-sm">
              {otherLocale.toUpperCase()}
            </Link>
            <button
              onClick={() => setMode(mode === "policy" ? "research" : "policy")}
              className="rounded border border-borderStrong px-3 py-2 text-sm"
            >
              {mode === "policy" ? t("mode.policy") : t("mode.research")}
            </button>
            <button
              onClick={() => setDensity((prev) => (prev === "comfortable" ? "compact" : "comfortable"))}
              className="rounded border border-borderSoft px-3 py-2 text-sm"
            >
              {density === "comfortable" ? t("density.comfortable") : t("density.compact")}
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-borderSoft bg-bg/95 backdrop-blur">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-3 px-4 py-3 md:grid-cols-5">
          <label className="text-sm">
            <div className="mb-1 text-textSecondary">{t("filters.timeWindow")}</div>
            <select className="w-full rounded border border-borderSoft bg-surface px-2 py-2" value={timeWindow} onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}>
              <option value="1h">1h</option>
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
            </select>
          </label>
          {mode === "research" && (
            <label className="text-sm">
              <div className="mb-1 text-textSecondary">{t("filters.category")}</div>
              <select className="w-full rounded border border-borderSoft bg-surface px-2 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All</option>
                <option value="policy">Policy</option>
                <option value="research">Research</option>
                <option value="industry">Industry</option>
                <option value="funding">Funding</option>
                <option value="news">News</option>
                <option value="incidents">Incidents</option>
              </select>
            </label>
          )}
          {mode === "research" && (
            <label className="text-sm">
              <div className="mb-1 text-textSecondary">{t("filters.region")}</div>
              <select className="w-full rounded border border-borderSoft bg-surface px-2 py-2" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
                <option value="">All</option>
                <option value="Canada">Canada</option>
                <option value="Global">Global</option>
                <option value="Ontario">Ontario</option>
                <option value="Quebec">Quebec</option>
                <option value="Alberta">Alberta</option>
              </select>
            </label>
          )}
          {mode === "research" && (
            <label className="text-sm">
              <div className="mb-1 text-textSecondary">{t("feed.language")}</div>
              <select className="w-full rounded border border-borderSoft bg-surface px-2 py-2" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="">All</option>
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="other">Other</option>
              </select>
            </label>
          )}
          <label className="text-sm">
            <div className="mb-1 text-textSecondary">{t("filters.keyword")}</div>
            <div className="flex items-center rounded border border-borderSoft bg-surface px-2">
              <Search size={16} color="var(--text-muted)" />
              <input
                className="w-full border-none bg-transparent px-2 py-2 text-text outline-none"
                placeholder={t("filters.keywordPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </label>
          <label className="text-sm">
            <div className="mb-1 text-textSecondary">{t("feed.sort")}</div>
            <select className="w-full rounded border border-borderSoft bg-surface px-2 py-2" value={feedSort} onChange={(e) => setFeedSort(e.target.value as "newest" | "confidence")}>
              <option value="newest">{t("feed.sortNewest")}</option>
              <option value="confidence">{t("feed.sortConfidence")}</option>
            </select>
          </label>
        </div>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-4 pb-3">
          <button onClick={savePreset} className="rounded border border-borderSoft px-2 py-1 text-xs">
            {t("filters.savePreset")}
          </button>
          <button onClick={clearFilters} className="rounded border border-borderSoft px-2 py-1 text-xs">
            {t("filters.clear")}
          </button>
          <button onClick={copyShareLink} className="rounded border border-borderSoft px-2 py-1 text-xs">
            {shareState === "copied"
              ? t("filters.shareCopied")
              : shareState === "failed"
                ? t("filters.shareFailed")
                : t("filters.share")}
          </button>
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center gap-1 rounded border border-borderSoft px-2 py-1 text-xs">
              <button onClick={() => applyPreset(preset)} className="text-left">
                {preset.name}
              </button>
              <button onClick={() => deletePreset(preset.id)} aria-label={`${t("filters.deletePreset")} ${preset.name}`}>
                x
              </button>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-4 pb-3">
          {activeFilters.map((chip) => (
            <button key={chip.id} onClick={chip.clear} className="rounded border border-borderSoft bg-surface px-2 py-1 text-xs">
              {chip.label} x
            </button>
          ))}
        </div>
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-2 px-4 pb-3 md:grid-cols-5">
          {scenarioPresets.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => applyScenario(scenario)}
              className="rounded border border-borderSoft bg-surface px-3 py-2 text-left text-xs"
            >
              <p className="font-medium">{t(`scenarios.${scenario.labelKey}`)}</p>
              <p className="mt-1 text-textMuted">{t(`scenarios.${scenario.descriptionKey}`)}</p>
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-4">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <article className="rounded-lg border border-borderSoft bg-surface p-4">
            <h2 className="text-sm text-textSecondary">{t("kpi.new15m")}</h2>
            {isInitialLoading ? (
              <div className="mt-2 space-y-2">
                <SkeletonLine width="55%" />
                <SkeletonLine width="35%" />
                <SkeletonLine width="45%" />
              </div>
            ) : (
              <>
                <p className="mt-2 text-3xl font-semibold">{kpis?.m15.current ?? 0}</p>
                <p className="mt-1 text-sm"><Delta value={kpis?.m15.delta_percent ?? 0} /></p>
                <p className="mt-1 text-xs text-textMuted">{t("kpi.previous")}: {kpis?.m15.previous ?? 0}</p>
              </>
            )}
          </article>
          <article className="rounded-lg border border-borderSoft bg-surface p-4">
            <h2 className="text-sm text-textSecondary">{t("kpi.new1h")}</h2>
            {isInitialLoading ? (
              <div className="mt-2 space-y-2">
                <SkeletonLine width="55%" />
                <SkeletonLine width="35%" />
                <SkeletonLine width="45%" />
              </div>
            ) : (
              <>
                <p className="mt-2 text-3xl font-semibold">{kpis?.h1.current ?? 0}</p>
                <p className="mt-1 text-sm"><Delta value={kpis?.h1.delta_percent ?? 0} /></p>
                <p className="mt-1 text-xs text-textMuted">{t("kpi.previous")}: {kpis?.h1.previous ?? 0}</p>
              </>
            )}
          </article>
          <article className="rounded-lg border border-borderSoft bg-surface p-4">
            <h2 className="text-sm text-textSecondary">{t("kpi.new7d")}</h2>
            {isInitialLoading ? (
              <div className="mt-2 space-y-2">
                <SkeletonLine width="55%" />
                <SkeletonLine width="35%" />
                <SkeletonLine width="45%" />
              </div>
            ) : (
              <>
                <p className="mt-2 text-3xl font-semibold">{kpis?.d7.current ?? 0}</p>
                <p className="mt-1 text-sm"><Delta value={kpis?.d7.delta_percent ?? 0} /></p>
                <p className="mt-1 text-xs text-textMuted">{t("kpi.previous")}: {kpis?.d7.previous ?? 0}</p>
              </>
            )}
          </article>
          <article className="rounded-lg border border-borderSoft bg-surface p-4">
            <h2 className="text-sm text-textSecondary">{t("kpi.topInsights")}</h2>
            <ul className="mt-2 list-disc pl-4 text-sm text-textSecondary">
              {topInsights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        </section>
        <section className="rounded-lg border border-borderSoft bg-surface p-4">
          <h3 className="text-sm font-semibold text-textSecondary">{t("pulse.title")}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-textSecondary">
            {executivePulse.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-borderSoft bg-surface p-4">
          <h3 className="text-sm font-semibold text-textSecondary">{t("narrative.title")}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-textSecondary">
            {strategicNarrative.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-borderSoft bg-surface p-4">
          <h3 className="text-sm font-semibold text-textSecondary">{t("summary.title")}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-textSecondary">
            {(summary?.bullets ?? []).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-borderSoft bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("brief.title")}</h3>
          <div className="grid grid-cols-1 gap-2 text-xs text-textSecondary md:grid-cols-5">
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("brief.total")}</p>
              <p className="mt-1 font-semibold">{brief?.total_items ?? 0}</p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("brief.topCategory")}</p>
              <p className="mt-1 font-semibold">{brief?.top_category?.name || "-"}</p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("brief.topJurisdiction")}</p>
              <p className="mt-1 font-semibold">{brief?.top_jurisdiction?.name || "-"}</p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("brief.topPublisher")}</p>
              <p className="mt-1 font-semibold">{brief?.top_publisher?.name || "-"}</p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("brief.highAlerts")}</p>
              <p className="mt-1 font-semibold">{brief?.high_alert_count ?? 0}</p>
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-borderSoft bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-textSecondary">{t("briefing.title")}</h3>
            <div className="flex items-center gap-2">
              <button onClick={saveCurrentBrief} className="rounded border border-borderSoft px-2 py-1 text-xs">
                {saveBriefState === "saved" ? t("briefing.saved") : t("briefing.save")}
              </button>
              <button onClick={downloadMorningBrief} className="rounded border border-borderSoft px-2 py-1 text-xs">
                {t("briefing.download")}
              </button>
              <button onClick={copyMorningBrief} className="rounded border border-borderSoft px-2 py-1 text-xs">
                {briefCopyState === "copied"
                  ? t("briefing.copied")
                  : briefCopyState === "failed"
                    ? t("briefing.copyFailed")
                    : t("briefing.copy")}
              </button>
            </div>
          </div>
          <pre className="overflow-x-auto rounded border border-borderSoft bg-bg p-3 text-xs text-textSecondary">
            {morningBriefMarkdown}
          </pre>
        </section>
        <section className="rounded-lg border border-borderSoft bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("compare.title")}</h3>
          <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
            <button onClick={() => setJurisdiction("Canada")} className="rounded border border-borderSoft bg-bg p-2 text-left">
              <p className="text-textMuted">{t("compare.canada")}</p>
              <p className="mt-1 font-semibold">{compare?.canada ?? 0}</p>
            </button>
            <button onClick={() => setJurisdiction("Global")} className="rounded border border-borderSoft bg-bg p-2 text-left">
              <p className="text-textMuted">{t("compare.global")}</p>
              <p className="mt-1 font-semibold">{compare?.global ?? 0}</p>
            </button>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("compare.other")}</p>
              <p className="mt-1 font-semibold">{compare?.other ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            {(compare?.categories ?? []).slice(0, 6).map((item) => (
              <div key={item.name} className="grid grid-cols-3 gap-2 rounded border border-borderSoft px-2 py-1">
                <span className="capitalize">{item.name}</span>
                <span>{t("compare.canadaShort")}: {item.canada}</span>
                <span>{t("compare.globalShort")}: {item.global}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-borderSoft bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("concentration.title")}</h3>
          <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-4">
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("concentration.combined")}</p>
              <p className="mt-1 font-semibold">
                {concentration?.combined_hhi?.toFixed(3) ?? "0.000"}{" "}
                <span style={{ color: concentrationTone(concentration?.combined_level ?? "low") }}>
                  {t(`concentration.${concentration?.combined_level ?? "low"}`)}
                </span>
              </p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("concentration.source")}</p>
              <p className="mt-1 font-semibold">
                {concentration?.source_hhi?.toFixed(3) ?? "0.000"}{" "}
                <span style={{ color: concentrationTone(concentration?.source_level ?? "low") }}>
                  {t(`concentration.${concentration?.source_level ?? "low"}`)}
                </span>
              </p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("concentration.jurisdiction")}</p>
              <p className="mt-1 font-semibold">
                {concentration?.jurisdiction_hhi?.toFixed(3) ?? "0.000"}{" "}
                <span style={{ color: concentrationTone(concentration?.jurisdiction_level ?? "low") }}>
                  {t(`concentration.${concentration?.jurisdiction_level ?? "low"}`)}
                </span>
              </p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("concentration.category")}</p>
              <p className="mt-1 font-semibold">
                {concentration?.category_hhi?.toFixed(3) ?? "0.000"}{" "}
                <span style={{ color: concentrationTone(concentration?.category_level ?? "low") }}>
                  {t(`concentration.${concentration?.category_level ?? "low"}`)}
                </span>
              </p>
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-borderSoft bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("risk.title")}</h3>
          <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-4">
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("risk.score")}</p>
              <p className="mt-1 font-semibold">
                {(riskIndex?.score ?? 0).toFixed(1)}{" "}
                <span style={{ color: concentrationTone(riskIndex?.level ?? "low") }}>
                  {t(`risk.${riskIndex?.level ?? "low"}`)}
                </span>
              </p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("risk.incidents")}</p>
              <p className="mt-1 font-semibold">{riskIndex?.incidents ?? 0}</p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("risk.lowConfidence")}</p>
              <p className="mt-1 font-semibold">{riskIndex?.low_confidence ?? 0}</p>
            </div>
            <div className="rounded border border-borderSoft bg-bg p-2">
              <p className="text-textMuted">{t("risk.highAlerts")}</p>
              <p className="mt-1 font-semibold">{riskIndex?.high_alert_count ?? 0}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {(riskIndex?.reasons ?? []).map((reason) => (
              <span key={reason} className="rounded border border-borderSoft px-2 py-1 text-textSecondary">
                {t(`riskReason.${reason}`)}
              </span>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-borderSoft bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-textSecondary">{t("regional.title")}</h3>
            <span className="text-xs text-textMuted">{t("regional.helper")}</span>
          </div>
          <div className="space-y-2">
            {(jurisdictionsBreakdown?.jurisdictions ?? []).slice(0, 6).map((item) => {
              const total = Math.max(1, jurisdictionsBreakdown?.total ?? 1);
              const width = Math.max(6, Math.round((item.count / total) * 100));
              const active = jurisdiction === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setJurisdiction(item.name);
                    setMode("research");
                  }}
                  className="block w-full rounded border border-borderSoft px-3 py-2 text-left text-xs"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className={active ? "font-semibold" : ""}>{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-1.5 rounded bg-bg">
                    <div className="h-1.5 rounded" style={{ width: `${width}%`, background: "var(--primary)" }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <div className="mb-2 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <h3 className="text-lg font-semibold">{t("feed.live")}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-borderSoft px-2 py-1 text-xs">
                  {t("feed.liveStatus")}: {t(`feed.status_${sseStatus}`)}
                  {lastLiveAt ? ` - ${new Date(lastLiveAt).toLocaleTimeString()}` : ""}
                </span>
                <button onClick={() => refreshData().catch(() => undefined)} className="rounded border border-borderSoft px-2 py-1 text-xs">
                  {isRefreshing ? t("feed.refreshing") : t("feed.refresh")}
                </button>
                <select
                  value={String(autoRefreshSec)}
                  onChange={(e) => setAutoRefreshSec(Number(e.target.value) as 0 | 15 | 30 | 60)}
                  className="rounded border border-borderSoft bg-surface px-2 py-1 text-xs"
                  aria-label={t("feed.autoRefresh")}
                >
                  <option value="0">{t("feed.autoOff")}</option>
                  <option value="15">15s</option>
                  <option value="30">30s</option>
                  <option value="60">60s</option>
                </select>
                <span className="text-xs text-textMuted">
                  {t("feed.autoRefresh")}: {autoRefreshSec === 0 ? t("feed.autoOff") : `${autoRefreshSec}s`} | {t("feed.lastRefresh")}: {lastRefreshAt ? new Date(lastRefreshAt).toLocaleTimeString() : "-"}
                </span>
              </div>
              {mode === "research" && (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={exportUrl(
                      {
                        time_window: timeWindow,
                        category: category || undefined,
                        jurisdiction: jurisdiction || undefined,
                        language: language || undefined,
                        search: search || undefined,
                      },
                      "csv"
                    )}
                    className="rounded border border-borderSoft px-3 py-2 text-sm"
                  >
                    {t("feed.exportCsv")}
                  </a>
                  <a
                    href={exportUrl(
                      {
                        time_window: timeWindow,
                        category: category || undefined,
                        jurisdiction: jurisdiction || undefined,
                        language: language || undefined,
                        search: search || undefined,
                      },
                      "json"
                    )}
                    className="rounded border border-borderSoft px-3 py-2 text-sm"
                  >
                    {t("feed.exportJson")}
                  </a>
                </div>
              )}
            </div>
            <div className={`max-h-[900px] overflow-y-auto pr-1 ${density === "compact" ? "space-y-2" : "space-y-3"}`}>
              {isInitialLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <article key={`skeleton-${idx}`} className="rounded-lg border border-borderSoft bg-surface p-4">
                      <div className="space-y-2">
                        <SkeletonLine width="70%" />
                        <SkeletonLine width="90%" />
                        <SkeletonLine width="60%" />
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {!isInitialLoading && sortedFeed.length === 0 && (
                <div className="rounded-lg border border-borderSoft bg-surface p-4 text-sm text-textMuted">
                  {t("feed.empty")}
                </div>
              )}
              {!isInitialLoading && sortedFeed.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-lg border border-borderSoft bg-surface transition-all hover:-translate-y-0.5 hover:shadow-sm ${density === "compact" ? "p-3" : "p-4"}`}
                >
                  <div className={`flex flex-wrap items-center text-textMuted ${density === "compact" ? "gap-1 text-[11px]" : "gap-2 text-xs"}`}>
                    <span>{new Date(item.published_at).toLocaleString()}</span>
                    <RelativeTime value={item.published_at} />
                    <span className="rounded-full border px-2 py-0.5" style={{ borderColor: categoryColor[item.category], color: categoryColor[item.category] }}>
                      {item.category}
                    </span>
                    <span>{item.publisher}</span>
                    <span>{item.jurisdiction}</span>
                    <span className="rounded border border-borderSoft px-2">{item.language.toUpperCase()}</span>
                    {mode === "research" && <span>{t("feed.confidence")}: {item.confidence.toFixed(2)}</span>}
                  </div>
                  <h4 className={`${density === "compact" ? "mt-1 text-base font-semibold leading-tight" : "mt-2 text-lg font-semibold"}`}>
                    <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                  </h4>
                  {mode === "research" && (
                    <div className={`flex flex-wrap text-xs ${density === "compact" ? "mt-1 gap-1" : "mt-2 gap-2"}`}>
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded border border-borderSoft px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className={`flex items-center gap-2 ${density === "compact" ? "mt-2" : "mt-3"}`}>
                    <button
                      onClick={() => togglePin(item)}
                      className={`rounded border border-borderSoft text-sm ${density === "compact" ? "px-2 py-1" : "px-3 py-1.5"}`}
                    >
                      {isPinned(item.id) ? t("pins.unpin") : t("pins.pin")}
                    </button>
                    <button
                      onClick={() => setSelected(item)}
                      className={`rounded border border-borderSoft text-sm ${density === "compact" ? "px-2 py-1" : "px-3 py-1.5"}`}
                    >
                      {t("pins.details")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4 xl:col-span-2">
            {mode === "research" && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("panels.title")}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(panelVisibility).map(([key, enabled]) => (
                    <button
                      key={key}
                      onClick={() => togglePanel(key)}
                      className="rounded border border-borderSoft px-2 py-1"
                      style={{
                        color: enabled ? "var(--text)" : "var(--text-muted)",
                        background: enabled ? "var(--bg)" : "transparent",
                      }}
                    >
                      {t(`panels.${key}`)}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.backfill && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-3 text-sm font-semibold text-textSecondary">{t("backfill.title")}</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex flex-col gap-1">
                    <span className="text-textSecondary">{t("backfill.startDate")}</span>
                    <input
                      type="date"
                      value={backfillStartDate}
                      onChange={(e) => setBackfillStartDate(e.target.value)}
                      className="rounded border border-borderSoft bg-bg px-2 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-textSecondary">{t("backfill.endDate")}</span>
                    <input
                      type="date"
                      value={backfillEndDate}
                      onChange={(e) => setBackfillEndDate(e.target.value)}
                      className="rounded border border-borderSoft bg-bg px-2 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-textSecondary">{t("backfill.perPage")}</span>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={backfillPerPage}
                      onChange={(e) => setBackfillPerPage(Number(e.target.value || 50))}
                      className="rounded border border-borderSoft bg-bg px-2 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-textSecondary">{t("backfill.pagesPerMonth")}</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={backfillPagesPerMonth}
                      onChange={(e) => setBackfillPagesPerMonth(Number(e.target.value || 1))}
                      className="rounded border border-borderSoft bg-bg px-2 py-1.5"
                    />
                  </label>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="rounded border border-borderSoft px-2 py-1">{backfillStateLabel}</span>
                  <button
                    onClick={startBackfill}
                    disabled={isBackfillRunning || isBackfillSubmitting}
                    className="rounded border border-borderStrong px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("backfill.run")}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-textSecondary">
                  <span>{t("backfill.scanned")}: {backfillStatus?.scanned ?? 0}</span>
                  <span>{t("backfill.inserted")}: {backfillStatus?.inserted ?? 0}</span>
                  <span>{t("backfill.currentMonth")}: {backfillStatus?.current_month ?? "-"}</span>
                  <span>{t("backfill.error")}: {(backfillStatus?.error ?? backfillError) || "-"}</span>
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.cleanup && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-3 text-sm font-semibold text-textSecondary">{t("cleanup.title")}</h3>
                <div className="mb-3 flex items-center gap-2">
                  <button
                    onClick={previewCleanup}
                    disabled={cleanupStatus === "running"}
                    className="rounded border border-borderSoft px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("cleanup.preview")}
                  </button>
                  <button
                    onClick={runCleanup}
                    disabled={cleanupStatus === "running"}
                    className="rounded border border-borderStrong px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("cleanup.execute")}
                  </button>
                  <span className="rounded border border-borderSoft px-2 py-1 text-xs">
                    {t("cleanup.status")}: {cleanupStateLabel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-textSecondary">
                  <span>{t("cleanup.before")}: {cleanupResult?.synthetic_before ?? 0}</span>
                  <span>{t("cleanup.deleted")}: {cleanupResult?.deleted ?? 0}</span>
                  <span>{t("cleanup.after")}: {cleanupResult?.synthetic_after ?? 0}</span>
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.sourceHealth && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-textSecondary">{t("sources.title")}</h3>
                  <span className="text-xs text-textMuted">
                    {t("sources.updated")}: {sourceHealthUpdatedAt ? new Date(sourceHealthUpdatedAt).toLocaleTimeString() : "-"}
                  </span>
                </div>
                <div className="mb-2 grid grid-cols-2 gap-1 text-xs text-textSecondary">
                  <span>{t("sources.runStatus")}: {sourceHealthRunStatus || "-"}</span>
                  <span>{t("sources.insertedTotal")}: {sourceHealthInsertedTotal}</span>
                  <span>{t("sources.candidatesTotal")}: {sourceHealthCandidatesTotal}</span>
                  <span>{t("sources.skippedLockCount")}: {sourceHealthSkippedLockCount}</span>
                </div>
                <div className="space-y-2 text-xs">
                  {sourceHealth.length === 0 && <p className="text-textMuted">No source health yet.</p>}
                  {sourceHealth.map((src) => (
                    <div key={src.source} className="rounded border border-borderSoft px-2 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{src.source}</span>
                        <span className={src.status === "ok" ? "text-green-600" : "text-red-600"}>{src.status}</span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-1 text-textSecondary">
                        <span>{t("sources.fetched")}: {src.fetched}</span>
                        <span>{t("sources.accepted")}: {src.accepted}</span>
                        <span>{t("sources.inserted")}: {src.inserted}</span>
                        <span>{t("sources.duplicates")}: {src.duplicates ?? 0}</span>
                        <span>{t("sources.writeErrors")}: {src.write_errors ?? 0}</span>
                        <span>{t("sources.duration")}: {src.duration_ms}ms</span>
                      </div>
                      {src.error ? <p className="mt-1 text-red-600">{t("sources.error")}: {src.error}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.sourceFreshness && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("sources.freshnessTitle")}</h3>
                <div className="space-y-2 text-xs">
                  {sourceFreshness.length === 0 && <p className="text-textMuted">-</p>}
                  {sourceFreshness.slice(0, 8).map((src) => (
                    <div key={`${src.source}-fresh`} className="rounded border border-borderSoft px-2 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{src.source}</span>
                        <span
                          style={{
                            color:
                              src.level === "stale"
                                ? "var(--incidents)"
                                : src.level === "aging"
                                  ? "var(--warning)"
                                  : "var(--research)",
                          }}
                        >
                          {src.minutes}m
                        </span>
                      </div>
                      <p className="mt-1 text-textSecondary">
                        {t("sources.lastRun")}: {src.last_run ? new Date(src.last_run).toLocaleString() : "-"} | {t(`sources.${src.level}`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.sourceMix && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("sources.mixTitle")}</h3>
                <p className="mb-2 text-xs text-textMuted">
                  {t("sources.total")}: {sourcesBreakdown?.total ?? 0}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-borderSoft p-2">
                    <p className="mb-1 font-medium text-textSecondary">{t("sources.publishers")}</p>
                    <div className="space-y-1">
                      {(sourcesBreakdown?.publishers ?? []).slice(0, 5).map((item) => (
                        <div key={item.name} className="flex justify-between">
                          <span className="truncate pr-2">{item.name}</span>
                          <span>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded border border-borderSoft p-2">
                    <p className="mb-1 font-medium text-textSecondary">{t("sources.types")}</p>
                    <div className="space-y-1">
                      {(sourcesBreakdown?.source_types ?? []).map((item) => (
                        <div key={item.name} className="flex justify-between">
                          <span>{item.name}</span>
                          <span>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.coverageMatrix && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("coverage.title")}</h3>
                <p className="mb-2 text-xs text-textMuted">
                  {t("coverage.total")}: {coverage?.total ?? 0}
                </p>
                <p className="mb-2 text-xs text-textMuted">{t("coverage.clickHint")}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {coverageGroups.map((group) => (
                    <div key={group.key} className="rounded border border-borderSoft p-2">
                      <p className="mb-1 font-medium text-textSecondary">{group.label}</p>
                      <div className="space-y-1">
                        {group.rows.length === 0 && <p className="text-textMuted">-</p>}
                        {group.rows.slice(0, 5).map((item) => (
                          <button
                            key={`${group.key}-${item.name}`}
                            onClick={() => applyCoverageFilter(group.key, item.name)}
                            className="flex w-full items-center justify-between gap-2 rounded border border-transparent px-1 py-0.5 text-left hover:border-borderSoft hover:bg-bg"
                          >
                            <span className="truncate pr-2">{item.name}</span>
                            <span className="whitespace-nowrap">
                              {item.count} ({item.percent.toFixed(1)}%)
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.sourceQuality && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("sources.qualityTitle")}</h3>
                <div className="space-y-2 text-xs">
                  {sourceQuality.map((src) => (
                    <div key={src.source} className="rounded border border-borderSoft px-2 py-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">{src.source}</span>
                        <span>
                          {src.grade} - {src.score}
                        </span>
                      </div>
                      <div className="h-1.5 rounded bg-bg">
                        <div className="h-1.5 rounded" style={{ width: `${src.score}%`, background: "var(--primary)" }} />
                      </div>
                      <div className="mt-1 text-textSecondary">
                        {t("sources.inserted")}: {src.inserted} | {t("sources.duplicates")}: {src.duplicates ?? 0} | {t("sources.writeErrors")}: {src.write_errors ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.confidenceProfile && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("confidence.title")}</h3>
                <p className="mb-2 text-xs text-textMuted">
                  {t("confidence.average")}: {(confidenceProfile?.average_confidence ?? 0).toFixed(2)}
                </p>
                <div className="space-y-2 text-xs">
                  {(confidenceProfile?.buckets ?? []).map((bucket) => (
                    <div key={bucket.name} className="rounded border border-borderSoft px-2 py-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span>{t(`confidence.${bucket.name}`)}</span>
                        <span>{bucket.count} ({bucket.percent.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 rounded bg-bg">
                        <div
                          className="h-1.5 rounded"
                          style={{ width: `${Math.max(2, Math.round(bucket.percent))}%`, background: confidenceTone[bucket.name] ?? "var(--primary)" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.riskTrend && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("riskTrend.title")}</h3>
                <EChartsReact option={riskTrendOption} style={{ height: 240 }} notMerge lazyUpdate />
              </section>
            )}
            {mode === "research" && panelVisibility.momentum && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("momentum.title")}</h3>
                <div className="space-y-2 text-xs">
                  <p className="font-medium text-textSecondary">{t("momentum.categories")}</p>
                  {(momentum?.categories ?? []).slice(0, 5).map((item) => (
                    <button
                      key={`cat-${item.name}`}
                      onClick={() => {
                        setCategory(item.name);
                        setMode("research");
                      }}
                      className="flex w-full items-center justify-between rounded border border-borderSoft px-2 py-1 text-left"
                    >
                      <span className="capitalize">{item.name}</span>
                      <span style={{ color: item.change >= 0 ? "var(--research)" : "var(--incidents)" }}>
                        {item.change >= 0 ? "+" : ""}
                        {item.change} ({item.delta_percent.toFixed(1)}%)
                      </span>
                    </button>
                  ))}
                  <p className="pt-1 font-medium text-textSecondary">{t("momentum.publishers")}</p>
                  {(momentum?.publishers ?? []).slice(0, 5).map((item) => (
                    <button
                      key={`pub-${item.name}`}
                      onClick={() => {
                        setSearch(item.name);
                        setMode("research");
                      }}
                      className="flex w-full items-center justify-between rounded border border-borderSoft px-2 py-1 text-left"
                    >
                      <span className="truncate pr-2">{item.name}</span>
                      <span style={{ color: item.change >= 0 ? "var(--research)" : "var(--incidents)" }}>
                        {item.change >= 0 ? "+" : ""}
                        {item.change} ({item.delta_percent.toFixed(1)}%)
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.entityMomentum && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("entityMomentum.title")}</h3>
                <div className="space-y-2 text-xs">
                  {(entityMomentum?.entities ?? []).slice(0, 8).map((item) => (
                    <button
                      key={`entity-${item.name}`}
                      onClick={() => {
                        setSearch(item.name);
                        setMode("research");
                      }}
                      className="flex w-full items-center justify-between rounded border border-borderSoft px-2 py-1 text-left"
                    >
                      <span className="truncate pr-2">{item.name}</span>
                      <span style={{ color: item.change >= 0 ? "var(--research)" : "var(--incidents)" }}>
                        {item.change >= 0 ? "+" : ""}
                        {item.change} ({item.delta_percent.toFixed(1)}%)
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.pinnedSignals && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-textSecondary">{t("pins.title")}</h3>
                  <button
                    onClick={() => setPinnedItems([])}
                    className="rounded border border-borderSoft px-2 py-1 text-xs"
                    disabled={pinnedItems.length === 0}
                  >
                    {t("pins.clear")}
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  {pinnedItems.length === 0 && <p className="text-textMuted">{t("pins.none")}</p>}
                  {pinnedItems.slice(0, 8).map((item) => (
                    <div key={`pin-${item.id}`} className="rounded border border-borderSoft px-2 py-2">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-textMuted">{item.publisher}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <a href={item.url} target="_blank" rel="noreferrer" className="rounded border border-borderSoft px-2 py-1">
                          {t("pins.open")}
                        </a>
                        <button onClick={() => setSelected(item)} className="rounded border border-borderSoft px-2 py-1">
                          {t("pins.details")}
                        </button>
                        <button onClick={() => togglePin(item)} className="rounded border border-borderSoft px-2 py-1">
                          {t("pins.unpin")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.briefHistory && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-textSecondary">{t("briefHistory.title")}</h3>
                  <button
                    onClick={() => setSavedBriefs([])}
                    className="rounded border border-borderSoft px-2 py-1 text-xs"
                    disabled={savedBriefs.length === 0}
                  >
                    {t("briefHistory.clear")}
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  {savedBriefs.length === 0 && <p className="text-textMuted">{t("briefHistory.none")}</p>}
                  {savedBriefs.slice(0, 8).map((entry) => (
                    <div key={entry.id} className="rounded border border-borderSoft px-2 py-2">
                      <p className="font-medium">{new Date(entry.createdAt).toLocaleString()}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button onClick={() => copyBrief(entry.markdown)} className="rounded border border-borderSoft px-2 py-1">
                          {t("briefHistory.copy")}
                        </button>
                        <button onClick={() => downloadBrief(entry.markdown, entry.createdAt)} className="rounded border border-borderSoft px-2 py-1">
                          {t("briefHistory.download")}
                        </button>
                        <button
                          onClick={() => setSavedBriefs((prev) => prev.filter((item) => item.id !== entry.id))}
                          className="rounded border border-borderSoft px-2 py-1"
                        >
                          {t("briefHistory.delete")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.alertCenter && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-textSecondary">{t("alertCenter.title")}</h3>
                  <button
                    onClick={resetDismissedAlerts}
                    className="rounded border border-borderSoft px-2 py-1 text-xs"
                    disabled={dismissedAlertIds.length === 0}
                  >
                    {t("alertCenter.reset")}
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  {alertCenterItems.length === 0 && <p className="text-textMuted">{t("alertCenter.none")}</p>}
                  {alertCenterItems.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded border border-borderSoft px-2 py-2">
                      <span className="pr-2" style={{ color: item.severity === "high" ? "var(--incidents)" : "var(--text-secondary)" }}>
                        {item.message}
                      </span>
                      <button onClick={() => dismissAlertItem(item.id)} className="rounded border border-borderSoft px-2 py-1">
                        {t("alertCenter.dismiss")}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.alerts && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("alerts.title")}</h3>
                <div className="space-y-2 text-xs">
                  {alerts.length === 0 && <p className="text-textMuted">{t("alerts.none")}</p>}
                  {alerts.map((item) => {
                    const isUp = item.direction === "up";
                    const tone = item.severity === "high" ? "var(--incidents)" : "var(--warning)";
                    return (
                      <div key={`${item.category}-${item.direction}`} className="rounded border border-borderSoft px-2 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{item.category}</span>
                          <span style={{ color: tone }}>
                            {isUp ? t("alerts.spike") : t("alerts.drop")} {item.delta_percent > 0 ? "+" : ""}
                            {item.delta_percent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1 text-textSecondary">
                          {t("alerts.current")}: {item.current} | {t("alerts.previous")}: {item.previous}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.jurisdictions && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("sources.jurisdictions")}</h3>
                <div className="space-y-1 text-xs">
                  {(jurisdictionsBreakdown?.jurisdictions ?? []).slice(0, 8).map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <span className="truncate pr-2">{item.name}</span>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.entities && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("sources.entities")}</h3>
                <div className="space-y-1 text-xs">
                  {(entitiesBreakdown?.entities ?? []).slice(0, 8).map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <span className="truncate pr-2">{item.name}</span>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {mode === "research" && panelVisibility.tags && (
              <section className="rounded-lg border border-borderSoft bg-surface p-3">
                <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("sources.tags")}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(tagsBreakdown?.tags ?? []).slice(0, 14).map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        setSearch(item.name);
                        setMode("research");
                      }}
                      className="rounded border border-borderSoft px-2 py-1"
                    >
                      {item.name} ({item.count})
                    </button>
                  ))}
                </div>
              </section>
            )}
            {panelVisibility.hourly && (
            <section className="rounded-lg border border-borderSoft bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-textSecondary">{t("charts.hourly")}</h3>
                <span className="text-xs text-textMuted">{t("charts.drilldownHint")}</span>
              </div>
              {hourly ? (
                <EChartsReact option={hourlyOption} onEvents={chartEvents} style={{ height: 280 }} notMerge lazyUpdate />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-xs text-textMuted">{t("charts.loading")}</div>
              )}
            </section>
            )}
            {panelVisibility.weekly && (
            <section className="rounded-lg border border-borderSoft bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-textSecondary">{t("charts.weekly")}</h3>
                <span className="text-xs text-textMuted">{t("charts.drilldownHint")}</span>
              </div>
              {weekly ? (
                <EChartsReact option={weeklyOption} onEvents={chartEvents} style={{ height: 320 }} notMerge lazyUpdate />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-xs text-textMuted">{t("charts.loading")}</div>
              )}
            </section>
            )}
          </div>
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setSelected(null)}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-borderStrong bg-surface p-5"
            role="dialog"
            aria-modal="true"
            aria-label={t("feed.details")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <div className="flex items-center gap-2">
                <button className="rounded border border-borderSoft px-2 py-1 text-sm" onClick={copySelectedUrl}>
                  {copyState === "copied" ? t("feed.copied") : copyState === "failed" ? t("feed.copyFailed") : t("feed.copyUrl")}
                </button>
                <button className="rounded border border-borderSoft px-2 py-1 text-sm" onClick={() => setSelected(null)}>{t("feed.close")}</button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>URL:</strong> <a href={selected.url} target="_blank" rel="noreferrer">{selected.url}</a></p>
              <p><strong>{t("feed.publisher")}:</strong> {selected.publisher}</p>
              <p><strong>{t("feed.jurisdiction")}:</strong> {selected.jurisdiction}</p>
              <p><strong>{t("feed.language")}:</strong> {selected.language}</p>
              <p><strong>{t("feed.confidence")}:</strong> {selected.confidence.toFixed(2)}</p>
              <p><strong>{t("feed.entities")}:</strong> {selected.entities.join(", ") || "-"}</p>
              <p><strong>{t("feed.tags")}:</strong> {selected.tags.join(", ") || "-"}</p>
              <p><strong>source_id:</strong> {selected.source_id}</p>
              <p><strong>source_type:</strong> {selected.source_type}</p>
              <p><strong>hash:</strong> {selected.hash}</p>
              <p><strong>published_at:</strong> {selected.published_at}</p>
              <p><strong>ingested_at:</strong> {selected.ingested_at}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

