"use client";

import { memo, useState } from "react";
import { Settings, Layers, Play, Trash2, Pin, Clock, Bell, X, Copy, Download, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  BackfillStatus,
  FeedItem,
  Mode,
  PurgeSyntheticResponse,
} from "../../lib/types";
import {
  executeSyntheticPurge,
  previewSyntheticPurge,
  runBackfill,
} from "../../lib/api";
import type { SavedBrief } from "./constants";

interface SidebarHistoryProps {
  mode: Mode;
  panelVisibility: Record<string, boolean>;
  researchDrawers: Record<string, boolean>;
  onToggleResearchDrawer: (key: string) => void;
  onTogglePanel: (key: string) => void;
  // Backfill (external state for polling display)
  backfillStatus: BackfillStatus | null;
  isBackfillRunning: boolean;
  onBackfillStarted: () => void;
  onRefreshData: () => void;
  // Pinned signals
  pinnedItems: FeedItem[];
  onClearPinnedItems: () => void;
  onTogglePin: (item: FeedItem) => void;
  onSelectItem: (item: FeedItem) => void;
  // Brief history
  savedBriefs: SavedBrief[];
  onClearSavedBriefs: () => void;
  onDeleteSavedBrief: (id: string) => void;
  onCopyBrief: (markdown: string) => void;
  onDownloadBrief: (markdown: string, stamp?: string) => void;
  // Alert center
  alertCenterItems: Array<{
    id: string;
    severity: string;
    message: string;
  }>;
  dismissedAlertIds: string[];
  onDismissAlertItem: (id: string) => void;
  onResetDismissedAlerts: () => void;
}

export const SidebarHistory = memo(function SidebarHistory({
  mode,
  panelVisibility,
  researchDrawers,
  onToggleResearchDrawer,
  onTogglePanel,
  backfillStatus,
  isBackfillRunning,
  onBackfillStarted,
  onRefreshData,
  pinnedItems,
  onClearPinnedItems,
  onTogglePin,
  onSelectItem,
  savedBriefs,
  onClearSavedBriefs,
  onDeleteSavedBrief,
  onCopyBrief,
  onDownloadBrief,
  alertCenterItems,
  dismissedAlertIds,
  onDismissAlertItem,
  onResetDismissedAlerts,
}: SidebarHistoryProps) {
  const t = useTranslations();

  // Backfill local state
  const [backfillStartDate, setBackfillStartDate] = useState("2022-11-01");
  const [backfillEndDate, setBackfillEndDate] = useState("");
  const [backfillPerPage, setBackfillPerPage] = useState(50);
  const [backfillPagesPerMonth, setBackfillPagesPerMonth] = useState(1);
  const [isBackfillSubmitting, setIsBackfillSubmitting] = useState(false);
  const [backfillError, setBackfillError] = useState("");

  // Cleanup local state
  const [cleanupStatus, setCleanupStatus] = useState<
    "idle" | "running" | "done" | "failed"
  >("idle");
  const [cleanupResult, setCleanupResult] =
    useState<PurgeSyntheticResponse | null>(null);

  const backfillStateLabel = (() => {
    const key = backfillStatus?.state ?? "idle";
    if (key === "running") return t("backfill.running");
    if (key === "completed") return t("backfill.completed");
    if (key === "failed") return t("backfill.failed");
    if (key === "queued") return t("backfill.queued");
    return t("backfill.idle");
  })();

  const cleanupStateLabel = (() => {
    if (cleanupStatus === "running") return t("cleanup.running");
    if (cleanupStatus === "done") return t("cleanup.done");
    if (cleanupStatus === "failed") return t("cleanup.failed");
    return t("cleanup.idle");
  })();

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
      onBackfillStarted();
      if (response.status !== "queued") {
        setBackfillError("Backfill request not queued.");
      }
    } catch {
      setBackfillError("Backfill request failed.");
    } finally {
      setIsBackfillSubmitting(false);
    }
  }

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
      onRefreshData();
    } catch {
      setCleanupStatus("failed");
    }
  }

  if (mode !== "research") return null;

  return (
    <>
      {/* Drawer Toggles */}
      <section className="elevated p-3">
        <h3 className="mb-2 inline-flex items-center gap-1.5 text-subheading text-textSecondary">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
            <Settings size={13} className="text-primary" />
          </div>
          {t("drawers.title")}
        </h3>
        <div className="flex flex-wrap gap-2 text-caption">
          <button
            onClick={() => onToggleResearchDrawer("ops")}
            className="btn-ghost"
          >
            {researchDrawers.ops
              ? t("drawers.hideOps")
              : t("drawers.showOps")}
          </button>
          <button
            onClick={() => onToggleResearchDrawer("sources")}
            className="btn-ghost"
          >
            {researchDrawers.sources
              ? t("drawers.hideSources")
              : t("drawers.showSources")}
          </button>
          <button
            onClick={() => onToggleResearchDrawer("entities")}
            className="btn-ghost"
          >
            {researchDrawers.entities
              ? t("drawers.hideEntities")
              : t("drawers.showEntities")}
          </button>
          <button
            onClick={() => onToggleResearchDrawer("history")}
            className="btn-ghost"
          >
            {researchDrawers.history
              ? t("drawers.hideHistory")
              : t("drawers.showHistory")}
          </button>
        </div>
      </section>

      {/* Panel Visibility Toggles */}
      <section className="elevated p-3">
        <h3 className="mb-2 inline-flex items-center gap-1.5 text-subheading text-textSecondary">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
            <Layers size={13} className="text-primary" />
          </div>
          {t("panels.title")}
        </h3>
        <div className="flex flex-wrap gap-2 text-caption">
          {Object.entries(panelVisibility).map(([key, enabled]) => (
            <button
              key={key}
              onClick={() => onTogglePanel(key)}
              className="btn-ghost"
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

      {/* Backfill */}
      {researchDrawers.ops && panelVisibility.backfill && (
        <section className="elevated p-3">
          <h3 className="mb-3 inline-flex items-center gap-1.5 text-subheading text-textSecondary">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
              <Play size={13} className="text-primary" />
            </div>
            {t("backfill.title")}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-caption">
            <label className="flex flex-col gap-1">
              <span className="text-textSecondary">
                {t("backfill.startDate")}
              </span>
              <input
                type="date"
                value={backfillStartDate}
                onChange={(e) => setBackfillStartDate(e.target.value)}
                className="rounded-lg border border-borderSoft bg-bg px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-textSecondary">
                {t("backfill.endDate")}
              </span>
              <input
                type="date"
                value={backfillEndDate}
                onChange={(e) => setBackfillEndDate(e.target.value)}
                className="rounded-lg border border-borderSoft bg-bg px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-textSecondary">
                {t("backfill.perPage")}
              </span>
              <input
                type="number"
                min={10}
                max={200}
                value={backfillPerPage}
                onChange={(e) =>
                  setBackfillPerPage(Number(e.target.value || 50))
                }
                className="rounded-lg border border-borderSoft bg-bg px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-textSecondary">
                {t("backfill.pagesPerMonth")}
              </span>
              <input
                type="number"
                min={1}
                max={10}
                value={backfillPagesPerMonth}
                onChange={(e) =>
                  setBackfillPagesPerMonth(Number(e.target.value || 1))
                }
                className="rounded-lg border border-borderSoft bg-bg px-2 py-1.5"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between text-caption">
            <span className="rounded-lg bg-surfaceInset px-3 py-1.5">
              {backfillStateLabel}
            </span>
            <button
              onClick={startBackfill}
              disabled={isBackfillRunning || isBackfillSubmitting}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("backfill.run")}
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-caption text-textSecondary">
            <span>
              {t("backfill.scanned")}: {backfillStatus?.scanned ?? 0}
            </span>
            <span>
              {t("backfill.inserted")}: {backfillStatus?.inserted ?? 0}
            </span>
            <span>
              {t("backfill.currentMonth")}:{" "}
              {backfillStatus?.current_month ?? "-"}
            </span>
            <span>
              {t("backfill.error")}:{" "}
              {(backfillStatus?.error ?? backfillError) || "-"}
            </span>
          </div>
        </section>
      )}

      {/* Cleanup */}
      {researchDrawers.ops && panelVisibility.cleanup && (
        <section className="elevated p-3">
          <h3 className="mb-3 inline-flex items-center gap-1.5 text-subheading text-textSecondary">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
              <Trash2 size={13} className="text-primary" />
            </div>
            {t("cleanup.title")}
          </h3>
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={previewCleanup}
              disabled={cleanupStatus === "running"}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("cleanup.preview")}
            </button>
            <button
              onClick={runCleanup}
              disabled={cleanupStatus === "running"}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("cleanup.execute")}
            </button>
            <span className="rounded-lg bg-surfaceInset px-3 py-1.5 text-caption">
              {t("cleanup.status")}: {cleanupStateLabel}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-caption text-textSecondary">
            <span>
              {t("cleanup.before")}: {cleanupResult?.synthetic_before ?? 0}
            </span>
            <span>
              {t("cleanup.deleted")}: {cleanupResult?.deleted ?? 0}
            </span>
            <span>
              {t("cleanup.after")}: {cleanupResult?.synthetic_after ?? 0}
            </span>
          </div>
        </section>
      )}

      {/* Pinned Signals */}
      {researchDrawers.history && panelVisibility.pinnedSignals && (
        <section className="elevated p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-1.5 text-subheading text-textSecondary">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
                <Pin size={13} className="text-primary" />
              </div>
              {t("pins.title")}
            </h3>
            <button
              onClick={onClearPinnedItems}
              className="btn-ghost"
              disabled={pinnedItems.length === 0}
            >
              {t("pins.clear")}
            </button>
          </div>
          <div className="space-y-2 text-caption">
            {pinnedItems.length === 0 && (
              <p className="py-4 text-center text-caption text-textMuted italic">{t("pins.none")}</p>
            )}
            {pinnedItems.slice(0, 8).map((item) => (
              <div
                key={`pin-${item.id}`}
                className="rounded-lg bg-surfaceInset px-3 py-2.5"
              >
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-textMuted">{item.publisher}</p>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost"
                  >
                    {t("pins.open")}
                  </a>
                  <button
                    onClick={() => onSelectItem(item)}
                    className="btn-ghost"
                  >
                    {t("pins.details")}
                  </button>
                  <button
                    onClick={() => onTogglePin(item)}
                    className="btn-ghost"
                  >
                    {t("pins.unpin")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Brief History */}
      {researchDrawers.history && panelVisibility.briefHistory && (
        <section className="elevated p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-1.5 text-subheading text-textSecondary">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
                <Clock size={13} className="text-primary" />
              </div>
              {t("briefHistory.title")}
            </h3>
            <button
              onClick={onClearSavedBriefs}
              className="btn-ghost"
              disabled={savedBriefs.length === 0}
            >
              {t("briefHistory.clear")}
            </button>
          </div>
          <div className="space-y-2 text-caption">
            {savedBriefs.length === 0 && (
              <p className="py-4 text-center text-caption text-textMuted italic">{t("briefHistory.none")}</p>
            )}
            {savedBriefs.slice(0, 8).map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg bg-surfaceInset px-3 py-2.5"
              >
                <p className="font-medium">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => onCopyBrief(entry.markdown)}
                    className="btn-ghost"
                  >
                    {t("briefHistory.copy")}
                  </button>
                  <button
                    onClick={() =>
                      onDownloadBrief(entry.markdown, entry.createdAt)
                    }
                    className="btn-ghost"
                  >
                    {t("briefHistory.download")}
                  </button>
                  <button
                    onClick={() => onDeleteSavedBrief(entry.id)}
                    className="btn-ghost"
                  >
                    {t("briefHistory.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alert Center */}
      {researchDrawers.history && panelVisibility.alertCenter && (
        <section className="elevated p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-1.5 text-subheading text-textSecondary">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primarySubtle">
                <Bell size={13} className="text-primary" />
              </div>
              {t("alertCenter.title")}
            </h3>
            <button
              onClick={onResetDismissedAlerts}
              className="btn-ghost"
              disabled={dismissedAlertIds.length === 0}
            >
              {t("alertCenter.reset")}
            </button>
          </div>
          <div className="space-y-2 text-caption">
            {alertCenterItems.length === 0 && (
              <p className="py-4 text-center text-caption text-textMuted italic">{t("alertCenter.none")}</p>
            )}
            {alertCenterItems.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-surfaceInset px-3 py-2.5"
              >
                <span
                  className="pr-2"
                  style={{
                    color:
                      item.severity === "high"
                        ? "var(--incidents)"
                        : "var(--text-secondary)",
                  }}
                >
                  {item.message}
                </span>
                <button
                  onClick={() => onDismissAlertItem(item.id)}
                  className="btn-ghost"
                >
                  {t("alertCenter.dismiss")}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
});
