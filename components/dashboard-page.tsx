"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchAlerts,
  fetchCoverage,
  fetchEntitiesBreakdown,
  fetchTagsBreakdown,
  fetchBackfillStatus,
  fetchBrief,
  fetchCompare,
  fetchConcentration,
  fetchConfidence,
  fetchEntityMomentum,
  fetchMomentum,
  fetchRiskTrend,
  fetchRiskIndex,
  fetchAiSummary,
  fetchFeed,
  fetchHourly,
  fetchJurisdictionsBreakdown,
  fetchKpis,
  fetchSourcesBreakdown,
  fetchSourcesHealth,
  fetchWeekly,
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
  SourceHealthEntry,
  SourcesBreakdownResponse,
  TimeWindow,
  TagsBreakdownResponse,
  JurisdictionsBreakdownResponse,
} from "../lib/types";
import { useMode } from "./mode-provider";
import { useTheme } from "./theme-provider";

import { categoryColor, isCanadaJurisdiction, concentrationTone, confidenceTone } from "./dashboard/constants";
import type { FilterPreset, ScenarioPreset, SavedBrief } from "./dashboard/constants";
import { Delta, SkeletonLine } from "./dashboard/helpers";
import { CommandBar } from "./dashboard/command-bar";
import { FeedList } from "./dashboard/feed-list";
import { DetailModal } from "./dashboard/detail-modal";
import { SidebarAnalytics } from "./dashboard/sidebar-analytics";
import { SidebarSources } from "./dashboard/sidebar-sources";
import { SidebarEntities } from "./dashboard/sidebar-entities";
import { SidebarHistory } from "./dashboard/sidebar-history";
import { WelcomeBanner } from "./dashboard/welcome-banner";
import { StoryHero } from "./dashboard/story-hero";
import { TooltipHelp } from "./dashboard/tooltip-help";
import { QuickGuideButton, QuickGuidePanel } from "./dashboard/quick-guide";
import { DashboardShell } from "./dashboard/shell";
import { MetricTile, Tile } from "./dashboard/tile";
import { BackToTop } from "./dashboard/back-to-top";
import { Sparkline } from "./dashboard/sparkline";
import { PulseIndicator } from "./dashboard/pulse-indicator";
import { SignalHeatmap } from "./dashboard/signal-heatmap";
import { BriefCarousel } from "./dashboard/brief-carousel";
import { ComparisonCard } from "./dashboard/comparison-card";
import { CommandPalette } from "./dashboard/command-palette";
import { SignalOfDay } from "./dashboard/signal-of-day";

export function DashboardPage({ scope, initialTimeWindow = "7d", initialMode }: { scope: "canada", initialTimeWindow?: string, initialMode?: string }) {
  const hasHydratedTracker = useRef(false);
  const t = useTranslations();
  const locale = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { mode, setMode } = useMode();
  const [timeWindow, setTimeWindow] = useState<TimeWindow>((initialTimeWindow as TimeWindow) || "7d");
  const [category, setCategory] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [language, setLanguage] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [kpis, setKpis] = useState<KPIsResponse | null>(null);
  const [hourly, setHourly] = useState<EChartsResponse | null>(null);
  const [weekly, setWeekly] = useState<EChartsResponse | null>(null);
  const [selected, setSelected] = useState<FeedItem | null>(null);
  const [backfillStatus, setBackfillStatus] = useState<BackfillStatus | null>(null);
  const [isBackfillRunning, setIsBackfillRunning] = useState(false);
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
    backfill: false,
    cleanup: false,
    sourceHealth: false,
    sourceFreshness: false,
    sourceMix: false,
    coverageMatrix: false,
    sourceQuality: false,
    confidenceProfile: false,
    riskTrend: false,
    momentum: false,
    entityMomentum: false,
    pinnedSignals: false,
    briefHistory: false,
    alerts: false,
    alertCenter: false,
    jurisdictions: false,
    entities: false,
    tags: false,
    hourly: true,
    weekly: true,
  });
  const [researchDrawers, setResearchDrawers] = useState({
    ops: false,
    sources: false,
    entities: false,
    history: false,
  });
  const [briefCopyState, setBriefCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [saveBriefState, setSaveBriefState] = useState<"idle" | "saved">("idle");
  const [nowTs, setNowTs] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [autoRefreshSec, setAutoRefreshSec] = useState<0 | 15 | 30 | 60>(30);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [guideOpen, setGuideOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [feedSort, setFeedSort] = useState<"newest" | "confidence">("newest");
  const [pinnedItems, setPinnedItems] = useState<FeedItem[]>([]);
  const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const refreshInFlight = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoading = isRefreshing && !kpis && feed.length === 0;
  const openControlsAndFocusSearch = useCallback(() => {
    setControlsOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);

  // ⌘K / Ctrl+K keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  // --- Effects ---

  // Filters start closed — users open via button or Scenario presets

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (mode !== "policy") return;
    setCategory("");
    setLanguage("");
    setSearch("");
    if (jurisdiction && !isCanadaJurisdiction(jurisdiction)) {
      setJurisdiction("");
    }
  }, [mode, scope]);

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
        openControlsAndFocusSearch();
        return;
      }
      if (!inEditable && key === "/") {
        event.preventDefault();
        openControlsAndFocusSearch();
        return;
      }
      if (key === "escape" && selected) {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openControlsAndFocusSearch, selected]);

  function isWithinTimeWindow(publishedAt: string, windowSize: TimeWindow): boolean {
    const ts = new Date(publishedAt).getTime();
    if (!Number.isFinite(ts)) return false;
    const ageMs = Date.now() - ts;
    const maxAgeMs: Record<TimeWindow, number> = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "15d": 15 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
      "2y": 730 * 24 * 60 * 60 * 1000,
      "5y": 1825 * 24 * 60 * 60 * 1000,
    };
    const max = maxAgeMs[windowSize] ?? 30 * 24 * 60 * 60 * 1000;
    return ageMs <= max;
  }

  function matchesLiveFilters(item: FeedItem): boolean {
    if (!isCanadaJurisdiction(item.jurisdiction)) return false;
    if (category && item.category !== category) return false;
    if (jurisdiction && item.jurisdiction !== jurisdiction) return false;
    if (language && item.language !== language) return false;
    if (!isWithinTimeWindow(item.published_at, timeWindow)) return false;
    if (!debouncedSearch) return true;
    const needle = debouncedSearch.toLowerCase();
    const haystack = `${item.title} ${item.publisher} ${item.jurisdiction} ${(item.tags ?? []).join(" ")} ${(item.entities ?? []).join(" ")}`.toLowerCase();
    return haystack.includes(needle);
  }

  async function refreshData() {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setIsRefreshing(true);
    setRefreshError("");
    try {
      const results = await Promise.allSettled([
        fetchFeed({
          time_window: timeWindow,
          category: category || undefined,
          jurisdiction: jurisdiction || undefined,
          language: language || undefined,
          search: debouncedSearch || undefined,
          page: 1,
          page_size: 50,
        }),
        fetchKpis(),
        fetchHourly(),
        fetchWeekly(),
        fetchJurisdictionsBreakdown(timeWindow),
        fetchSourcesBreakdown(timeWindow),
        fetchTagsBreakdown(timeWindow),
        fetchBrief(timeWindow),
        fetchCompare(timeWindow),
        fetchConfidence(timeWindow),
        fetchConcentration(timeWindow),
        fetchMomentum(timeWindow, 8),
        fetchRiskIndex(timeWindow),
        fetchEntityMomentum(timeWindow, 10),
        fetchRiskTrend(timeWindow),
        fetchAiSummary(timeWindow),
        fetchCoverage(timeWindow, 8),
      ]);

      const seen = new Set<string>();
      if (results[0].status === "fulfilled") {
        const deduped = results[0].value.items.filter((item) => {
          if (!isCanadaJurisdiction(item.jurisdiction)) return false;
          const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setFeed(deduped);
      }
      if (results[1].status === "fulfilled") setKpis(results[1].value);
      if (results[2].status === "fulfilled") setHourly(results[2].value);
      if (results[3].status === "fulfilled") setWeekly(results[3].value);
      if (results[4].status === "fulfilled") setJurisdictionsBreakdown(results[4].value);
      if (results[5].status === "fulfilled") setSourcesBreakdown(results[5].value);
      if (results[6].status === "fulfilled") setTagsBreakdown(results[6].value);
      if (results[7].status === "fulfilled") setBrief(results[7].value);
      if (results[8].status === "fulfilled") setCompare(results[8].value);
      if (results[9].status === "fulfilled") setConfidenceProfile(results[9].value);
      if (results[10].status === "fulfilled") setConcentration(results[10].value);
      if (results[11].status === "fulfilled") setMomentum(results[11].value);
      if (results[12].status === "fulfilled") setRiskIndex(results[12].value);
      if (results[13].status === "fulfilled") setEntityMomentum(results[13].value);
      if (results[14].status === "fulfilled") setRiskTrend(results[14].value);
      if (results[15].status === "fulfilled") setSummary(results[15].value);
      if (results[16].status === "fulfilled") setCoverage(results[16].value);
      setLastRefreshAt(new Date().toISOString());
    } catch {
      setRefreshError(t("feed.refreshFailed"));
    } finally {
      setIsRefreshing(false);
      refreshInFlight.current = false;
    }
  }

  useEffect(() => {
    refreshData().catch(() => undefined);
  }, [timeWindow, category, jurisdiction, language, debouncedSearch]);

  useEffect(() => {
    if (autoRefreshSec === 0) return;
    const timer = setInterval(() => {
      refreshData().catch(() => undefined);
    }, autoRefreshSec * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshSec, timeWindow, category, jurisdiction, language, debouncedSearch]);

  useEffect(() => {
    setSseStatus("connecting");
    const source = new EventSource(sseUrl());
    source.onopen = () => {
      setSseStatus("live");
    };
    source.onerror = (err) => {
      // SSE is not supported on Vercel Serverless — fall back to polling.
      // Show "live" status since the polling-based refresh keeps data fresh.
      console.warn("SSE encountered an error, falling back to polling.", err);
      source.close();
      setSseStatus("live");
    };
    const handler = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as FeedItem;
        if (!matchesLiveFilters(payload)) return;
        setSseStatus("live");
        setLastLiveAt(new Date().toISOString());
        setFeed((prev) => [payload, ...prev].slice(0, 100));
      } catch {
        return;
      }
    };
    source.addEventListener("new_item", handler);
    return () => source.close();
  }, [scope, category, jurisdiction, language, debouncedSearch, timeWindow]);

  const hasTranslation = (key: string) => {
    try {
      t(key);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (mode !== "research") return;

    let mounted = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const poll = async () => {
      try {
        const results = await Promise.allSettled([
          fetchBackfillStatus(),
          fetchSourcesHealth(),
          fetchSourcesBreakdown(timeWindow),
          fetchJurisdictionsBreakdown(timeWindow),
          fetchEntitiesBreakdown(timeWindow),
          fetchTagsBreakdown(timeWindow),
          fetchAlerts(timeWindow),
        ]);
        if (!mounted) return;
        if (results[0].status === "fulfilled") {
          setBackfillStatus(results[0].value);
          setIsBackfillRunning(results[0].value.state === "running");
        }
        if (results[1].status === "fulfilled") {
          const sources = results[1].value;
          setSourceHealth(sources.sources ?? []);
          setSourceHealthUpdatedAt(sources.updated_at ?? "");
          setSourceHealthRunStatus(sources.run_status ?? "");
          setSourceHealthInsertedTotal(sources.inserted_total ?? 0);
          setSourceHealthCandidatesTotal(sources.candidates_total ?? 0);
          setSourceHealthSkippedLockCount(sources.skipped_lock_count ?? 0);
        }
        if (results[2].status === "fulfilled") setSourcesBreakdown(results[2].value);
        if (results[3].status === "fulfilled") setJurisdictionsBreakdown(results[3].value);
        if (results[4].status === "fulfilled") setEntitiesBreakdown(results[4].value);
        if (results[5].status === "fulfilled") setTagsBreakdown(results[5].value);
        if (results[6].status === "fulfilled") setAlerts(results[6].value.alerts ?? []);
      } catch {
        if (!mounted) return;
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
    if (!hasHydratedTracker.current) return;
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
    if (!hasHydratedTracker.current) return;
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
    if (!hasHydratedTracker.current) return;
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
    if (!hasHydratedTracker.current) return;
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
    if (!hasHydratedTracker.current) return;
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
    if (!hasHydratedTracker.current) return;
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
    if (!hasHydratedTracker.current) return;
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
    if (!hasHydratedTracker.current) return;
    localStorage.setItem(`dismissed_alerts_${scope}`, JSON.stringify(dismissedAlertIds));
  }, [dismissedAlertIds, scope]);

  useEffect(() => {
    if (initialMode && (initialMode === "policy" || initialMode === "research")) {
      setMode(initialMode as "policy" | "research");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    const jur = params.get("jur");
    const lang = params.get("lang");
    const q = params.get("q");
    if (cat) setCategory(cat);
    if (jur) setJurisdiction(jur);
    if (lang) setLanguage(lang);
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    if (!hasHydratedTracker.current) return;
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

  useEffect(() => {
    hasHydratedTracker.current = true;
  }, []);

  // --- Computed values ---

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

  const topCategoryCoverage = useMemo(() => {
    return (coverage?.categories ?? []).slice(0, 5);
  }, [coverage]);

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
    const topJurisdiction = scope === "canada"
      ? (jurisdictionsBreakdown?.jurisdictions ?? []).find((j) => isCanadaJurisdiction(j.name))
      : jurisdictionsBreakdown?.jurisdictions?.[0];
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

  const liveMinutesSinceUpdate = useMemo(() => {
    if (!lastLiveAt) return null;
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(lastLiveAt).getTime()) / 60000));
    return Number.isFinite(minutes) ? minutes : null;
  }, [lastLiveAt, nowTs]);

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
        const msg = hasTranslation(`riskReason.${reason}`) ? `${t("risk.title")}: ${hasTranslation(`riskReason.${reason}`) ? t(`riskReason.${reason}`) : reason}` : `${t("risk.title")}: ${reason}`;
        items.push({ id, severity: "high", message: msg });
      });
    return items.filter((item) => !dismissedAlertIds.includes(item.id)).slice(0, 20);
  }, [alerts, sourceFreshness, riskIndex?.reasons, dismissedAlertIds, t]);

  const hourlyOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-soft)",
        borderWidth: 1,
        textStyle: { color: "var(--text)", fontSize: 12 },
        formatter: (params: Array<{ seriesName: string; value: number; color: string }>) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const total = params.reduce((sum: number, p: { value: number }) => sum + (p.value || 0), 0);
          const header = `<strong>${total} signal${total !== 1 ? "s" : ""}</strong><br/>`;
          const rows = params
            .filter((p: { value: number }) => p.value > 0)
            .map((p: { color: string; seriesName: string; value: number }) => `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong>${p.value}</strong>`)
            .join("<br/>");
          return header + rows;
        },
      },
      legend: { show: false },
      grid: { top: 20, right: 15, bottom: 50, left: 45 },
      xAxis: {
        type: "category",
        data: (hourly?.xAxis ?? []).map((label: string) => {
          try { return new Date(label).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return label; }
        }),
        axisLabel: { color: "var(--text-muted)", rotate: 45, fontSize: 11 },
      },
      yAxis: { type: "value", axisLabel: { color: "var(--text-muted)", fontSize: 11 } },
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
        textStyle: { color: "var(--text)", fontSize: 12 },
        formatter: (params: Array<{ seriesName: string; value: number; color: string }>) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const total = params.reduce((sum: number, p: { value: number }) => sum + (p.value || 0), 0);
          const header = `<strong>${total} signal${total !== 1 ? "s" : ""}</strong><br/>`;
          const rows = params
            .filter((p: { value: number }) => p.value > 0)
            .map((p: { color: string; seriesName: string; value: number }) => `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong>${p.value}</strong>`)
            .join("<br/>");
          return header + rows;
        },
      },
      legend: { show: false },
      grid: { top: 20, right: 15, bottom: 50, left: 45 },
      xAxis: {
        type: "category",
        data: (weekly?.xAxis ?? []).map((label: string) => {
          try { return new Date(label).toLocaleDateString([], { month: "short", day: "numeric" }); } catch { return label; }
        }),
        axisLabel: { color: "var(--text-muted)", rotate: 45, fontSize: 11 },
      },
      yAxis: { type: "value", axisLabel: { color: "var(--text-muted)", fontSize: 11 } },
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

  // --- Event handlers ---

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

  const togglePanel = useCallback((panel: string) => {
    setPanelVisibility((prev) => ({ ...prev, [panel]: !prev[panel] }));
  }, []);

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

  const clearFilters = useCallback(() => {
    setTimeWindow("24h");
    setCategory("");
    setJurisdiction("");
    setLanguage("");
    setSearch("");
  }, []);

  const activeFilters = useMemo(() => {
    const chips: Array<{ id: string; label: string; clear: () => void }> = [];
    if (timeWindow !== "24h") {
      chips.push({ id: "tw", label: `${t("filters.timeWindow")}: ${timeWindow}`, clear: () => setTimeWindow("24h") });
    }
    if (category) chips.push({ id: "cat", label: `${t("filters.category")}: ${category}`, clear: () => setCategory("") });
    if (jurisdiction) chips.push({ id: "jur", label: `${t("filters.region")}: ${jurisdiction}`, clear: () => setJurisdiction("") });
    if (language) chips.push({ id: "lang", label: `${t("feed.language")}: ${language.toUpperCase()}`, clear: () => setLanguage("") });
    if (search) chips.push({ id: "q", label: `${t("filters.keyword")}: ${search}`, clear: () => setSearch("") });
    if (feedSort !== "newest") {
      chips.push({ id: "sort", label: `${t("feed.sort")}: ${t("feed.sortConfidence")}`, clear: () => setFeedSort("newest") });
    }
    return chips;
  }, [t, timeWindow, category, jurisdiction, language, search, feedSort]);

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

  const isPinned = useCallback(
    (id: string): boolean => pinnedItems.some((item) => item.id === id),
    [pinnedItems]
  );

  const togglePin = useCallback((item: FeedItem) => {
    setPinnedItems((prev) => {
      const exists = prev.some((entry) => entry.id === item.id);
      if (exists) return prev.filter((entry) => entry.id !== item.id);
      return [item, ...prev].slice(0, 30);
    });
  }, []);

  const toggleResearchDrawer = useCallback((key: string) => {
    setResearchDrawers((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }, []);

  const dismissAlertItem = useCallback((id: string) => {
    setDismissedAlertIds((prev) => (prev.includes(id) ? prev : [id, ...prev].slice(0, 200)));
  }, []);

  const resetDismissedAlerts = useCallback(() => {
    setDismissedAlertIds([]);
  }, []);

  // --- Morning brief ---

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

  const downloadBrief = useCallback((markdown: string, stamp?: string) => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const prefix = "canada";
    const datePart = stamp ? stamp.slice(0, 10) : new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `${prefix}-ai-pulse-brief-${datePart}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [scope]);

  function downloadMorningBrief() {
    downloadBrief(morningBriefMarkdown);
  }

  const copyBrief = useCallback(async (markdown: string) => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      return;
    }
  }, []);

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

  // --- Concentration dimensions for loop rendering ---
  const concentrationDimensions = useMemo(
    () => [
      { key: "combined", hhi: concentration?.combined_hhi, level: concentration?.combined_level },
      { key: "source", hhi: concentration?.source_hhi, level: concentration?.source_level },
      { key: "jurisdiction", hhi: concentration?.jurisdiction_hhi, level: concentration?.jurisdiction_level },
      { key: "category", hhi: concentration?.category_hhi, level: concentration?.category_level },
    ],
    [concentration]
  );

  const backfillStateLabel = useMemo(() => {
    const key = backfillStatus?.state ?? "idle";
    if (key === "running") return t("backfill.running");
    if (key === "completed") return t("backfill.completed");
    if (key === "failed") return t("backfill.failed");
    if (key === "queued") return t("backfill.queued");
    return t("backfill.idle");
  }, [backfillStatus?.state, t]);

  const lastRefreshLabel = lastRefreshAt ? new Date(lastRefreshAt).toLocaleTimeString() : "--";
  const liveStatusClass =
    sseStatus === "live" ? "live" : sseStatus === "error" ? "error" : "pending";

  // --- Render ---

  return (
    <DashboardShell
      locale={locale}
      activeScope={scope}
      navLabels={{
        canada: t("nav.canada"),
        methods: t("nav.methods"),
      }}
      otherLocale={otherLocale}
      theme={theme}
      onToggleTheme={toggleTheme}
      headerMeta={(
        <div className="dd-meta-strip">
          <PulseIndicator status={sseStatus} lastSignalAt={lastLiveAt} className="mr-1" />
          <span className={`dd-meta-pill ${liveStatusClass}`}>
            {t("feed.liveStatus")}
          </span>
          <span className="dd-meta-pill">{t("filters.timeWindow")}: {timeWindow.toUpperCase()}</span>
          <span className="dd-meta-pill">{t("feed.lastRefresh")}: {lastRefreshLabel}</span>
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
        <CommandBar
          mode={mode}
          timeWindow={timeWindow}
          category={category}
          jurisdiction={jurisdiction}
          language={language}
          search={search}
          feedSort={feedSort}
          presets={presets}
          scenarioPresets={scenarioPresets}
          activeFilters={activeFilters}
          searchInputRef={searchInputRef}
          onTimeWindowChange={setTimeWindow}
          onCategoryChange={setCategory}
          onJurisdictionChange={setJurisdiction}
          onLanguageChange={setLanguage}
          onSearchChange={setSearch}
          onFeedSortChange={setFeedSort}
          onSavePreset={savePreset}
          onApplyPreset={applyPreset}
          onDeletePreset={deletePreset}
          onClearFilters={clearFilters}
          onApplyScenario={applyScenario}
        />
      ) : null}
    >
      <main className="dd-dashboard-main mx-auto max-w-[1720px] space-y-4 px-4 py-4 md:px-5">
        {/* Story Hero with auto-generated narrative */}
        <StoryHero
          scope={scope}
          timeWindow={timeWindow}
          kpis={kpis}
          jurisdictionsBreakdown={jurisdictionsBreakdown}
          alerts={alerts}
          totalSignals={feed.length}
        />

        {/* Welcome Banner (first visit only) */}
        <WelcomeBanner />

        {/* Mode + Actions row */}
        <div className="dd-action-row flex flex-wrap items-center gap-2">
          {/* Segmented mode toggle */}
          <div className="inline-flex rounded-lg border border-borderSoft overflow-hidden">
            <button
              onClick={() => setMode("policy")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${mode === "policy"
                ? "bg-[var(--primary-action)] text-white"
                : "bg-transparent text-textSecondary hover:bg-surfaceInset"
                }`}
            >
              {t("mode.policy")}
            </button>
            <button
              onClick={() => setMode("research")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${mode === "research"
                ? "bg-[var(--primary-action)] text-white"
                : "bg-transparent text-textSecondary hover:bg-surfaceInset"
                }`}
            >
              {t("mode.research")}
            </button>
          </div>
          <button onClick={() => setAnalysisExpanded((prev) => !prev)} className="btn-ghost">
            {analysisExpanded ? t("hero.hideAnalysis") : t("hero.showAnalysis")}
          </button>
          <Link href={`/${locale}/methods`} className="btn-ghost text-textSecondary">
            {t("hero.howItWorks")}
          </Link>
        </div>



        {/* KPIs */}
        <section className="dd-kpi-band grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <MetricTile
              label={t("kpi.new15m")}
              value={kpis?.m15.current ?? 0}
              tone={(kpis?.m15.delta_percent ?? 0) >= 0 ? "ok" : "critical"}
              loading={isInitialLoading}
              className="dd-animate-scale" style={{ '--stagger': 0 } as React.CSSProperties}
              footer={(
                <div className="flex items-center justify-between gap-2">
                  <Delta value={kpis?.m15.delta_percent ?? 0} />
                  <span className="dd-metric-footnote">{t("kpi.previous")}: {kpis?.m15.previous ?? 0}</span>
                </div>
              )}
              spark={hourly?.series?.[0]?.data ? <Sparkline data={hourly.series[0].data.slice(-12)} color="#2bbb83" width={72} height={24} /> : undefined}
            />
            <MetricTile
              label={t("kpi.new1h")}
              value={kpis?.h1.current ?? 0}
              tone={(kpis?.h1.delta_percent ?? 0) >= 0 ? "ok" : "critical"}
              loading={isInitialLoading}
              className="dd-animate-scale" style={{ '--stagger': 1 } as React.CSSProperties}
              footer={(
                <div className="flex items-center justify-between gap-2">
                  <Delta value={kpis?.h1.delta_percent ?? 0} />
                  <span className="dd-metric-footnote">{t("kpi.previous")}: {kpis?.h1.previous ?? 0}</span>
                </div>
              )}
              spark={hourly?.series?.[0]?.data ? <Sparkline data={hourly.series[0].data.slice(-24)} color="#4585df" width={72} height={24} /> : undefined}
            />
            <MetricTile
              label={t("kpi.new7d")}
              value={kpis?.d7.current ?? 0}
              tone={(kpis?.d7.delta_percent ?? 0) >= 0 ? "ok" : "critical"}
              loading={isInitialLoading}
              className="dd-animate-scale" style={{ '--stagger': 2 } as React.CSSProperties}
              footer={(
                <div className="flex items-center justify-between gap-2">
                  <Delta value={kpis?.d7.delta_percent ?? 0} />
                  <span className="dd-metric-footnote">{t("kpi.previous")}: {kpis?.d7.previous ?? 0}</span>
                </div>
              )}
              spark={weekly?.series?.[0]?.data ? <Sparkline data={weekly.series[0].data} color="#e3a954" width={72} height={24} /> : undefined}
            />
            <MetricTile
              label={t("risk.title")}
              value={(riskIndex?.score ?? 0).toFixed(1)}
              tone={riskIndex?.level === "high" ? "critical" : riskIndex?.level === "medium" ? "warn" : "info"}
              loading={isInitialLoading}
              className="dd-animate-scale" style={{ '--stagger': 3 } as React.CSSProperties}
              footer={(
                <div className="flex items-center justify-between gap-2">
                  <span className="capitalize">{t(`risk.${riskIndex?.level ?? "low"}`)}</span>
                  <span className="dd-metric-footnote">{t("risk.incidents")}: {riskIndex?.incidents ?? 0}</span>
                </div>
              )}
            />
          </div>
          <Tile title={t("kpi.topInsights")} className="insight-card p-4">
            {isInitialLoading ? (
              <div className="dd-visual-bars mt-2">
                <SkeletonLine width="92%" />
                <SkeletonLine width="78%" />
                <SkeletonLine width="64%" />
              </div>
            ) : topCategoryCoverage.length === 0 ? (
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-textSecondary">
                {topInsights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <div className="dd-visual-bars">
                {topCategoryCoverage.map((item) => {
                  const width = Math.max(6, Math.round(item.percent));
                  return (
                    <div key={item.name} className="dd-visual-row">
                      <div className="dd-visual-head">
                        <span className="capitalize">{item.name}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="dd-visual-track">
                        <div
                          className="dd-visual-fill"
                          style={{
                            width: `${width}%`,
                            background: categoryColor[item.name] ?? "var(--primary-action)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Tile>
        </section>

        {/* Signal Heatmap + Brief Carousel + Canada vs World */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <SignalHeatmap
              hourlyData={hourly}
              activeCategory={category}
              onCellClick={(_slot, cat) => setCategory(cat === category ? "" : cat)}
              loading={isInitialLoading}
            />
            <BriefCarousel
              summary={summary}
              brief={brief}
              loading={isInitialLoading}
            />
          </div>
          <ComparisonCard
            compareData={compare}
            loading={isInitialLoading}
          />
        </div>

        {analysisExpanded ? (
          <>
            <section className="dd-story-grid grid grid-cols-1 gap-3 xl:grid-cols-3">
              <Tile title={t("pulse.title")} className="p-4">
                {isInitialLoading ? (
                  <div className="mt-3 space-y-2"><SkeletonLine width="80%" /><SkeletonLine width="65%" /><SkeletonLine width="50%" /></div>
                ) : executivePulse.length === 0 ? (
                  <p className="py-4 text-center text-caption text-textMuted italic">{t("pulse.noData")}</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-textSecondary">
                    {executivePulse.map((line) => (<li key={line}>{line}</li>))}
                  </ul>
                )}
              </Tile>
              <Tile title={t("narrative.title")} className="p-4">
                {isInitialLoading ? (
                  <div className="mt-3 space-y-2"><SkeletonLine width="85%" /><SkeletonLine width="70%" /><SkeletonLine width="55%" /></div>
                ) : strategicNarrative.length === 0 ? (
                  <p className="py-4 text-center text-caption text-textMuted italic">{t("narrative.noData")}</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-textSecondary">
                    {strategicNarrative.map((line) => (<li key={line}>{line}</li>))}
                  </ul>
                )}
              </Tile>
              <Tile title={t("summary.title")} className="p-4">
                {isInitialLoading ? (
                  <div className="mt-3 space-y-2"><SkeletonLine width="90%" /><SkeletonLine width="75%" /><SkeletonLine width="60%" /></div>
                ) : (summary?.bullets ?? []).length === 0 ? (
                  <p className="py-4 text-center text-caption text-textMuted italic">{t("summary.noData")}</p>
                ) : (
                  <ul className="mt-3 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-textSecondary">
                    {(summary?.bullets ?? []).map((line) => (<li key={line} className="pl-1">{line}</li>))}
                  </ul>
                )}
              </Tile>
            </section>

            {/* Morning Brief Snapshot (research only) */}
            {mode === "research" && (
              <section className="elevated p-4">
                <h3 className="mb-3 text-subheading text-textSecondary">{t("brief.title")}<TooltipHelp term="briefSnapshot" /></h3>
                <div className="grid grid-cols-1 gap-3 text-caption text-textSecondary md:grid-cols-5">
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("brief.total")}</p>
                    <p className="mt-1 font-semibold">{brief?.total_items ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("brief.topCategory")}</p>
                    <p className="mt-1 font-semibold">{brief?.top_category?.name || "-"}</p>
                  </div>
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("brief.topJurisdiction")}</p>
                    <p className="mt-1 font-semibold">{brief?.top_jurisdiction?.name || "-"}</p>
                  </div>
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("brief.topPublisher")}</p>
                    <p className="mt-1 font-semibold">{brief?.top_publisher?.name || "-"}</p>
                  </div>
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("brief.highAlerts")}</p>
                    <p className="mt-1 font-semibold">{brief?.high_alert_count ?? 0}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Morning Briefing (research only) */}
            {mode === "research" && (
              <section className="elevated p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-subheading text-textSecondary">{t("briefing.title")}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={saveCurrentBrief} className="btn-ghost">
                      {saveBriefState === "saved" ? t("briefing.saved") : t("briefing.save")}
                    </button>
                    <button onClick={downloadMorningBrief} className="btn-ghost">
                      {t("briefing.download")}
                    </button>
                    <button onClick={copyMorningBrief} className="btn-ghost">
                      {briefCopyState === "copied"
                        ? t("briefing.copied")
                        : briefCopyState === "failed"
                          ? t("briefing.copyFailed")
                          : t("briefing.copy")}
                    </button>
                  </div>
                </div>
                <pre className="overflow-x-auto rounded-lg bg-surfaceInset p-3 text-caption font-mono text-textSecondary">
                  {morningBriefMarkdown}
                </pre>
              </section>
            )}

            {/* Scope Compare (research only) */}
            {mode === "research" && (
              <section className="elevated p-4">
                <h3 className="mb-3 text-subheading text-textSecondary">{t("compare.title")}<TooltipHelp term="scopeCompare" /></h3>
                <div className="grid grid-cols-1 gap-3 text-caption md:grid-cols-3">
                  <button onClick={() => setJurisdiction("Canada")} className="rounded-lg bg-surfaceInset p-3 text-left transition-all hover:shadow-xs">
                    <p className="text-micro text-textMuted">{t("compare.canada")}</p>
                    <p className="mt-1 font-semibold">{compare?.canada ?? 0}</p>
                  </button>
                  <button onClick={() => setJurisdiction("Global")} className="rounded-lg bg-surfaceInset p-3 text-left transition-all hover:shadow-xs">
                    <p className="text-micro text-textMuted">{t("compare.global")}</p>
                    <p className="mt-1 font-semibold">{compare?.global ?? 0}</p>
                  </button>
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("compare.other")}</p>
                    <p className="mt-1 font-semibold">{compare?.other ?? 0}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-caption">
                  {(compare?.categories ?? []).slice(0, 6).map((item) => (
                    <div key={item.name} className="grid grid-cols-3 gap-2 rounded-lg bg-surfaceInset px-3 py-2">
                      <span className="capitalize">{item.name}</span>
                      <span>{t("compare.canadaShort")}: {item.canada}</span>
                      <span>{t("compare.globalShort")}: {item.global}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Concentration (research only) */}
            {mode === "research" && (
              <section className="elevated p-4">
                <h3 className="mb-3 text-subheading text-textSecondary">{t("concentration.title")}<TooltipHelp term="concentration" /></h3>
                <div className="grid grid-cols-1 gap-3 text-caption md:grid-cols-4">
                  {concentrationDimensions.map((dim) => (
                    <div key={dim.key} className="rounded-lg bg-surfaceInset p-3">
                      <p className="text-micro text-textMuted">{t(`concentration.${dim.key}`)}</p>
                      <p className="mt-1 font-semibold">
                        {dim.hhi?.toFixed(3) ?? "0.000"}{" "}
                        <span style={{ color: concentrationTone(dim.level ?? "low") }}>
                          {t(`concentration.${dim.level ?? "low"}`)}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Risk Index (research only) */}
            {mode === "research" && (
              <section className="elevated p-4">
                <h3 className="mb-3 text-subheading text-textSecondary">{t("risk.title")}<TooltipHelp term="riskIndex" /></h3>
                <div className="grid grid-cols-1 gap-3 text-caption md:grid-cols-4">
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("risk.score")}</p>
                    <p className="mt-1 font-semibold">
                      {(riskIndex?.score ?? 0).toFixed(1)}{" "}
                      <span style={{ color: concentrationTone(riskIndex?.level ?? "low") }}>
                        {t(`risk.${riskIndex?.level ?? "low"}`)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("risk.incidents")}</p>
                    <p className="mt-1 font-semibold">{riskIndex?.incidents ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("risk.lowConfidence")}</p>
                    <p className="mt-1 font-semibold">{riskIndex?.low_confidence ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-surfaceInset p-3">
                    <p className="text-micro text-textMuted">{t("risk.highAlerts")}</p>
                    <p className="mt-1 font-semibold">{riskIndex?.high_alert_count ?? 0}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(riskIndex?.reasons ?? []).map((reason) => (
                    <span key={reason} className="badge badge-neutral">
                      {hasTranslation(`riskReason.${reason}`) ? t(`riskReason.${reason}`) : reason}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : null}
        {/* Regional Focus */}
        <section className="elevated p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-subheading text-textSecondary">{t("regional.title")}</h3>
            <span className="text-micro text-textMuted">{t("regional.helper")}</span>
          </div>
          <div className="space-y-2">
            {(jurisdictionsBreakdown?.jurisdictions ?? [])
              .filter((item) => scope !== "canada" || isCanadaJurisdiction(item.name))
              .slice(0, 6).map((item) => {
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
                    className="block w-full rounded-lg bg-surfaceInset px-3 py-2.5 text-left text-caption transition-all hover:shadow-xs"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className={active ? "font-semibold" : ""}>{item.name}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-bg">
                      <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${width}%`, background: "var(--primary-action)" }} />
                    </div>
                  </button>
                );
              })}
          </div>
        </section>

        {/* Feed + Sidebar Grid */}
        <section className="dd-feed-layout grid grid-cols-1 gap-5 xl:grid-cols-5">
          <FeedList
            mode={mode}
            timeWindow={timeWindow}
            category={category}
            jurisdiction={jurisdiction}
            language={language}
            search={search}
            density={density}
            sortedFeed={sortedFeed}
            isInitialLoading={isInitialLoading}
            isRefreshing={isRefreshing}
            refreshError={refreshError}
            sseStatus={sseStatus}
            lastLiveAt={lastLiveAt}
            liveMinutesSinceUpdate={liveMinutesSinceUpdate}
            autoRefreshSec={autoRefreshSec}
            lastRefreshAt={lastRefreshAt}
            onRefresh={() => refreshData().catch(() => undefined)}
            onAutoRefreshChange={setAutoRefreshSec}
            onSetCategory={setCategory}
            onSetJurisdiction={setJurisdiction}
            onSetLanguage={setLanguage}
            onSetSearch={setSearch}
            onSetMode={setMode}
            onSetTimeWindow={setTimeWindow}
            onClearFilters={clearFilters}
            onTogglePin={togglePin}
            onSelectItem={setSelected}
            isPinned={isPinned}
          />

          <div className="space-y-5 xl:col-span-2">
            {/* Charts first for visibility */}
            <SidebarAnalytics
              mode={mode}
              panelVisibility={panelVisibility}
              sourceHealth={sourceHealth}
              sourceHealthUpdatedAt={sourceHealthUpdatedAt}
              sourceHealthRunStatus={sourceHealthRunStatus}
              sourceHealthInsertedTotal={sourceHealthInsertedTotal}
              sourceHealthCandidatesTotal={sourceHealthCandidatesTotal}
              sourceHealthSkippedLockCount={sourceHealthSkippedLockCount}
              confidenceProfile={confidenceProfile}
              riskTrendOption={riskTrendOption}
              momentum={momentum}
              alerts={alerts}
              hourly={hourly}
              hourlyOption={hourlyOption}
              weekly={weekly}
              weeklyOption={weeklyOption}
              chartEvents={chartEvents}
              onSetCategory={setCategory}
              onSetSearch={setSearch}
              onSetMode={setMode}
            />

            <SidebarHistory
              mode={mode}
              panelVisibility={panelVisibility}
              researchDrawers={researchDrawers}
              backfillStatus={backfillStatus}
              isBackfillRunning={isBackfillRunning}
              pinnedItems={pinnedItems}
              savedBriefs={savedBriefs}
              alertCenterItems={alertCenterItems}
              dismissedAlertIds={dismissedAlertIds}
              onToggleResearchDrawer={toggleResearchDrawer}
              onTogglePanel={togglePanel}
              onBackfillStarted={() => setIsBackfillRunning(true)}
              onSelectItem={setSelected}
              onTogglePin={togglePin}
              onClearPinnedItems={() => setPinnedItems([])}
              onClearSavedBriefs={() => setSavedBriefs([])}
              onDeleteSavedBrief={(id) => setSavedBriefs((prev) => prev.filter((item) => item.id !== id))}
              onCopyBrief={copyBrief}
              onDownloadBrief={downloadBrief}
              onDismissAlertItem={dismissAlertItem}
              onResetDismissedAlerts={resetDismissedAlerts}
              onRefreshData={() => refreshData().catch(() => undefined)}
            />

            <SidebarSources
              mode={mode}
              panelVisibility={panelVisibility}
              researchDrawerOpen={researchDrawers.sources}
              sourceFreshness={sourceFreshness}
              sourcesBreakdown={sourcesBreakdown}
              coverageGroups={coverageGroups}
              sourceQuality={sourceQuality}
              coverageTotal={coverage?.total ?? 0}
              onApplyCoverageFilter={applyCoverageFilter}
            />

            <SidebarEntities
              mode={mode}
              panelVisibility={panelVisibility}
              researchDrawerOpen={researchDrawers.entities}
              entityMomentum={entityMomentum}
              jurisdictionsBreakdown={jurisdictionsBreakdown}
              entitiesBreakdown={entitiesBreakdown}
              tagsBreakdown={tagsBreakdown}
              onSetSearch={setSearch}
              onSetMode={setMode}
            />
          </div>
        </section>
      </main>

      {/* Detail Modal */}
      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)} />
      )}

      <BackToTop />

      {/* Command Palette */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        scope={scope}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSetCategory={setCategory}
        onSetTimeWindow={(tw) => setTimeWindow(tw as any)}
        locale={locale}
        mode={mode}
        onToggleMode={() => setMode(mode === "policy" ? "research" : "policy")}
        analysisExpanded={analysisExpanded}
        onToggleAnalysis={() => setAnalysisExpanded(prev => !prev)}
      />
    </DashboardShell>
  );
}





