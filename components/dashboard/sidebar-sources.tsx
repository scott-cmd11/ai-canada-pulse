"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type {
  CoverageResponse,
  CoverageRow,
  Mode,
  SourceHealthEntry,
  SourcesBreakdownResponse,
} from "../../lib/types";

interface SidebarSourcesProps {
  mode: Mode;
  panelVisibility: Record<string, boolean>;
  researchDrawerOpen: boolean;
  sourceFreshness: Array<SourceHealthEntry & { minutes: number; level: string }>;
  sourcesBreakdown: SourcesBreakdownResponse | null;
  coverageGroups: Array<{ key: string; label: string; rows: CoverageRow[] }>;
  sourceQuality: Array<SourceHealthEntry & { score: number; grade: string }>;
  coverageTotal: number;
  onApplyCoverageFilter: (groupKey: string, value: string) => void;
}

export const SidebarSources = memo(function SidebarSources({
  mode,
  panelVisibility,
  researchDrawerOpen,
  sourceFreshness,
  sourcesBreakdown,
  coverageGroups,
  sourceQuality,
  coverageTotal,
  onApplyCoverageFilter,
}: SidebarSourcesProps) {
  const t = useTranslations();

  if (mode !== "research" || !researchDrawerOpen) return null;

  return (
    <>
      {/* Source Freshness */}
      {panelVisibility.sourceFreshness && (
        <section className="elevated p-3">
          <h3 className="mb-2 text-subheading text-textSecondary">
            {t("sources.freshnessTitle")}
          </h3>
          <div className="space-y-2 text-caption">
            {sourceFreshness.length === 0 && (
              <p className="py-4 text-center text-caption text-textMuted italic">-</p>
            )}
            {sourceFreshness.slice(0, 8).map((src) => (
              <div
                key={`${src.source}-fresh`}
                className="rounded-lg bg-surfaceInset px-3 py-2.5"
              >
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
                  {t("sources.lastRun")}:{" "}
                  {src.last_run
                    ? new Date(src.last_run).toLocaleString()
                    : "-"}{" "}
                  | {t(`sources.${src.level}`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Source Mix */}
      {panelVisibility.sourceMix && (
        <section className="elevated p-3">
          <h3 className="mb-2 text-subheading text-textSecondary">
            {t("sources.mixTitle")}
          </h3>
          <p className="mb-2 text-caption text-textMuted">
            {t("sources.total")}: {sourcesBreakdown?.total ?? 0}
          </p>
          <div className="grid grid-cols-2 gap-2 text-caption">
            <div className="rounded-lg bg-surfaceInset px-3 py-2.5">
              <p className="mb-1 font-medium text-textSecondary">
                {t("sources.publishers")}
              </p>
              <div className="space-y-1">
                {(sourcesBreakdown?.publishers ?? [])
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <span className="truncate pr-2">{item.name}</span>
                      <span>{item.count}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="rounded-lg bg-surfaceInset px-3 py-2.5">
              <p className="mb-1 font-medium text-textSecondary">
                {t("sources.types")}
              </p>
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

      {/* Coverage Matrix */}
      {panelVisibility.coverageMatrix && (
        <section className="elevated p-3">
          <h3 className="mb-2 text-subheading text-textSecondary">
            {t("coverage.title")}
          </h3>
          <p className="mb-2 text-caption text-textMuted">
            {t("coverage.total")}: {coverageTotal}
          </p>
          <p className="mb-2 text-caption text-textMuted">
            {t("coverage.clickHint")}
          </p>
          <div className="grid grid-cols-2 gap-2 text-caption">
            {coverageGroups.map((group) => (
              <div
                key={group.key}
                className="rounded-lg bg-surfaceInset px-3 py-2.5"
              >
                <p className="mb-1 font-medium text-textSecondary">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.rows.length === 0 && (
                    <p className="py-4 text-center text-caption text-textMuted italic">-</p>
                  )}
                  {group.rows.slice(0, 5).map((item) => (
                    <button
                      key={`${group.key}-${item.name}`}
                      onClick={() =>
                        onApplyCoverageFilter(group.key, item.name)
                      }
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

      {/* Source Quality */}
      {panelVisibility.sourceQuality && (
        <section className="elevated p-3">
          <h3 className="mb-2 text-subheading text-textSecondary">
            {t("sources.qualityTitle")}
          </h3>
          <div className="space-y-2 text-caption">
            {sourceQuality.map((src) => (
              <div
                key={src.source}
                className="rounded-lg bg-surfaceInset px-3 py-2.5"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{src.source}</span>
                  <span>
                    {src.grade} - {src.score}
                  </span>
                </div>
                <div className="h-1.5 rounded bg-bg">
                  <div
                    className="h-1.5 rounded"
                    style={{
                      width: `${src.score}%`,
                      background:
                        src.score > 80
                          ? "var(--research)"
                          : src.score > 50
                            ? "var(--warning)"
                            : "var(--incidents)",
                    }}
                  />
                </div>
                <div className="mt-1 text-textSecondary">
                  {t("sources.inserted")}: {src.inserted} |{" "}
                  {t("sources.duplicates")}: {src.duplicates ?? 0} |{" "}
                  {t("sources.writeErrors")}: {src.write_errors ?? 0}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
});
