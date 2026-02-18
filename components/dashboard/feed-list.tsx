"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, RefreshCw, Pin, PinOff, ExternalLink, Info, Download, Search, Github, BookOpen, Newspaper, Landmark, FlaskConical, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FeedItem, Mode, TimeWindow } from "../../lib/types";
import { exportUrl } from "../../lib/api";
import { categoryColor } from "./constants";
import { RelativeTime, SkeletonLine } from "./helpers";

function SourceIcon({ type, size = 12 }: { type: string; size?: number }) {
  switch (type) {
    case "repository":
      return <Github size={size} className="text-textMuted" />;
    case "academic":
      return <FlaskConical size={size} className="text-textMuted" />;
    case "gov":
      return <Landmark size={size} className="text-textMuted" />;
    case "media":
      return <Newspaper size={size} className="text-textMuted" />;
    case "industry":
      return <Package size={size} className="text-textMuted" />;
    default:
      return <BookOpen size={size} className="text-textMuted" />;
  }
}

interface FeedListProps {
  mode: Mode;
  timeWindow: TimeWindow;
  category: string;
  jurisdiction: string;
  language: string;
  search: string;
  density: "comfortable" | "compact";
  sortedFeed: FeedItem[];
  isInitialLoading: boolean;
  isRefreshing: boolean;
  refreshError: string;
  sseStatus: "connecting" | "live" | "error";
  lastLiveAt: string;
  liveMinutesSinceUpdate: number | null;
  autoRefreshSec: 0 | 15 | 30 | 60;
  lastRefreshAt: string;
  onRefresh: () => void;
  onAutoRefreshChange: (sec: 0 | 15 | 30 | 60) => void;
  onSetCategory: (cat: string) => void;
  onSetJurisdiction: (jur: string) => void;
  onSetLanguage: (lang: string) => void;
  onSetSearch: (q: string) => void;
  onSetMode: (m: Mode) => void;
  onSetTimeWindow: (tw: TimeWindow) => void;
  onClearFilters: () => void;
  onTogglePin: (item: FeedItem) => void;
  onSelectItem: (item: FeedItem) => void;
  isPinned: (id: string) => boolean;
}

export function FeedList({
  mode,
  timeWindow,
  category,
  jurisdiction,
  language,
  search,
  density,
  sortedFeed,
  isInitialLoading,
  isRefreshing,
  refreshError,
  sseStatus,
  lastLiveAt,
  liveMinutesSinceUpdate,
  autoRefreshSec,
  lastRefreshAt,
  onRefresh,
  onAutoRefreshChange,
  onSetCategory,
  onSetJurisdiction,
  onSetLanguage,
  onSetSearch,
  onSetMode,
  onSetTimeWindow,
  onClearFilters,
  onTogglePin,
  onSelectItem,
  isPinned,
}: FeedListProps) {
  const t = useTranslations();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());
  const [keyboardHintDismissed, setKeyboardHintDismissed] = useState(true); // default hidden until hydration

  useEffect(() => {
    try {
      setKeyboardHintDismissed(localStorage.getItem("ai_pulse_keyboard_hint_dismissed") === "true");
    } catch {
      setKeyboardHintDismissed(false);
    }
  }, []);

  const dismissKeyboardHint = useCallback(() => {
    setKeyboardHintDismissed(true);
    try { localStorage.setItem("ai_pulse_keyboard_hint_dismissed", "true"); } catch { /* ignore */ }
  }, []);

  // Keyboard navigation: j/k to move, Enter to open details
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!sortedFeed.length) return;
      // Only handle if no input/select/textarea is focused
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = Math.min(prev + 1, sortedFeed.length - 1);
          cardRefs.current.get(next)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return next;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          cardRefs.current.get(next)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return next;
        });
      } else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < sortedFeed.length) {
        e.preventDefault();
        onSelectItem(sortedFeed[focusedIndex]);
      }
    },
    [sortedFeed, focusedIndex, onSelectItem]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset focused index when feed changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [sortedFeed.length]);

  return (
    <div className="xl:col-span-3">
      <div className="mb-3 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <h3 className="text-heading">{t("feed.live")}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-neutral">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                background:
                  sseStatus === "live"
                    ? "var(--status-positive)"
                    : sseStatus === "error"
                      ? "var(--status-negative)"
                      : "var(--status-warning)",
              }}
            />
            {t(`feed.status_${sseStatus}`)}
            {lastLiveAt
              ? ` - ${new Date(lastLiveAt).toLocaleTimeString()}`
              : ""}
          </span>
          {liveMinutesSinceUpdate !== null &&
            liveMinutesSinceUpdate >= 10 && (
              <span className="badge badge-status-warning">
                {t("feed.staleWarning")} ({liveMinutesSinceUpdate}m)
              </span>
            )}
          <button
            onClick={onRefresh}
            className="btn-secondary"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? t("feed.refreshing") : t("feed.refresh")}
          </button>
          <select
            value={String(autoRefreshSec)}
            onChange={(e) =>
              onAutoRefreshChange(
                Number(e.target.value) as 0 | 15 | 30 | 60
              )
            }
            className="rounded-lg border border-transparent bg-surfaceInset px-2.5 py-1.5 text-caption outline-none"
            aria-label={t("feed.autoRefresh")}
          >
            <option value="0">{t("feed.autoOff")}</option>
            <option value="15">15s</option>
            <option value="30">30s</option>
            <option value="60">60s</option>
          </select>
          <span className="text-micro text-textMuted">
            {t("feed.autoRefresh")}:{" "}
            {autoRefreshSec === 0
              ? t("feed.autoOff")
              : `${autoRefreshSec}s`}{" "}
            | {t("feed.lastRefresh")}:{" "}
            {lastRefreshAt
              ? new Date(lastRefreshAt).toLocaleTimeString()
              : "-"}
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
              className="btn-secondary"
            >
              <Download size={14} />
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
              className="btn-secondary"
            >
              <Download size={14} />
              {t("feed.exportJson")}
            </a>
          </div>
        )}
      </div>
      {refreshError && (
        <div className="mb-2 rounded-lg bg-surfaceInset px-3 py-2 text-caption" style={{ color: "var(--status-negative)" }}>
          {refreshError}
        </div>
      )}
      {/* Keyboard hint — dismissible */}
      {!isInitialLoading && sortedFeed.length > 0 && !keyboardHintDismissed && (
        <div className="mb-3 flex items-center gap-2 text-micro text-textMuted">
          <p>
            {t.rich("feed.keyboardNav", {
              j: (chunks) => <kbd className="badge badge-neutral mx-0.5 font-mono px-1.5 py-0.5">j</kbd>,
              k: (chunks) => <kbd className="badge badge-neutral mx-0.5 font-mono px-1.5 py-0.5">k</kbd>,
              enter: (chunks) => <kbd className="badge badge-neutral mx-0.5 font-mono px-1.5 py-0.5">Enter</kbd>,
            })}
          </p>
          <button
            onClick={dismissKeyboardHint}
            className="ml-auto shrink-0 rounded border border-borderSoft px-2 py-0.5 text-micro text-textMuted hover:text-textSecondary"
          >
            {t("feed.keyboardDismiss")}
          </button>
        </div>
      )}
      <div
        className={`max-h-[900px] overflow-y-auto pr-1 ${density === "compact" ? "space-y-1.5" : "space-y-2"}`}
      >
        {isInitialLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <article
                key={`skeleton-${idx}`}
                className="elevated p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <SkeletonLine width="6rem" />
                  <SkeletonLine width="4rem" />
                  <SkeletonLine width="3rem" />
                </div>
                <SkeletonLine width="85%" />
                <div className="mt-2">
                  <SkeletonLine width="60%" />
                </div>
                <div className="mt-4 flex gap-2">
                  <SkeletonLine width="5rem" />
                  <SkeletonLine width="5rem" />
                </div>
              </article>
            ))}
          </div>
        )}
        {!isInitialLoading && sortedFeed.length === 0 && (
          <div className="elevated p-10 flex flex-col items-center text-center">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primarySubtle">
              <Search size={24} className="text-primary" />
            </div>
            <p className="text-heading text-text">{t("feed.empty")}</p>
            <p className="mt-2 max-w-md text-body text-textMuted">{t("feed.filteredHint")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={onClearFilters}
                className="btn-secondary"
              >
                {t("feed.resetFilters")}
              </button>
              <button
                onClick={() => onSetTimeWindow("15d")}
                className="btn-ghost"
              >
                {t("feed.expand15d")}
              </button>
              <button
                onClick={() => onSetTimeWindow("30d")}
                className="btn-ghost"
              >
                {t("feed.expand30d")}
              </button>
            </div>
          </div>
        )}
        {!isInitialLoading &&
          sortedFeed.map((item, index) => (
            <article
              key={item.id}
              ref={(el) => {
                if (el) cardRefs.current.set(index, el);
                else cardRefs.current.delete(index);
              }}
              className={`feed-card elevated ${density === "compact" ? "p-3" : "p-4"
                } ${focusedIndex === index
                  ? "!border-[var(--primary-action)] ring-2 ring-[var(--primary-action)]/30"
                  : ""
                } cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-action)]/50`}
              onClick={() => setFocusedIndex(index)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectItem(item); } }}
              tabIndex={0}
              role="button"
              aria-label={item.title}
            >
              <div
                className={`flex flex-wrap items-center text-textMuted ${density === "compact" ? "gap-1.5 text-micro" : "gap-2 text-caption"}`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: categoryColor[item.category] ?? "var(--text-muted)" }}
                  aria-label={item.category}
                  title={item.category}
                />
                <span className="inline-flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(item.published_at).toLocaleString()}
                </span>
                <RelativeTime value={item.published_at} />
                <button
                  onClick={() => {
                    onSetCategory(item.category);
                    onSetMode("research");
                  }}
                  className="badge badge-category cursor-pointer"
                  style={{ "--badge-color": categoryColor[item.category] } as React.CSSProperties}
                >
                  {item.category}
                </button>
                <button
                  onClick={() => {
                    onSetSearch(item.publisher);
                    onSetMode("research");
                  }}
                  className="badge badge-neutral cursor-pointer"
                >
                  <SourceIcon type={item.source_type} size={10} />
                  {item.publisher}
                </button>
                <button
                  onClick={() => {
                    onSetJurisdiction(item.jurisdiction);
                    onSetMode("research");
                  }}
                  className="badge badge-neutral cursor-pointer"
                >
                  {item.jurisdiction}
                </button>
                <button
                  onClick={() => {
                    onSetLanguage(item.language);
                    onSetMode("research");
                  }}
                  className="badge badge-neutral cursor-pointer"
                >
                  {item.language.toUpperCase()}
                </button>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-micro font-medium"
                  style={{
                    background: item.confidence >= 0.8 ? "var(--research)" : item.confidence >= 0.5 ? "var(--policy)" : item.confidence >= 0.3 ? "var(--warning)" : "var(--incidents)",
                    color: "white",
                    opacity: 0.85,
                  }}
                  title={`${t("feed.confidence")}: ${(item.confidence * 100).toFixed(0)}%`}
                >
                  {(item.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <h4
                className={`line-clamp-2 ${density === "compact" ? "mt-1.5 text-body font-semibold leading-tight" : "mt-2 text-subheading"}`}
              >
                <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-text hover:text-primary transition-colors">
                  {item.title}
                  <ExternalLink size={12} className="shrink-0 opacity-0 group-hover:opacity-100 text-textMuted" />
                </a>
              </h4>
              {mode === "research" && (
                <div
                  className={`flex flex-wrap ${density === "compact" ? "mt-1.5 gap-1.5" : "mt-2 gap-2"}`}
                >
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge badge-neutral"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div
                className={`flex items-center gap-2 ${density === "compact" ? "mt-2" : "mt-3"}`}
              >
                <button
                  onClick={() => onTogglePin(item)}
                  className="btn-ghost text-caption"
                >
                  {isPinned(item.id) ? (
                    <>
                      <PinOff size={12} />
                      {t("pins.unpin")}
                    </>
                  ) : (
                    <>
                      <Pin size={12} />
                      {t("pins.pin")}
                    </>
                  )}
                </button>
                <button
                  onClick={() => onSelectItem(item)}
                  className="btn-ghost text-caption"
                >
                  <Info size={12} />
                  {t("pins.details")}
                </button>
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
