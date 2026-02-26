"use client";

import { useState, type RefObject } from "react";
import { Search, Share2, Bookmark, X, ChevronDown, ChevronUp, RotateCcw, Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TimeWindow, Mode } from "../../lib/types";
import type { FilterPreset, ScenarioPreset } from "./constants";

interface CommandBarProps {
  mode: Mode;
  timeWindow: TimeWindow;
  category: string;
  jurisdiction: string;
  language: string;
  search: string;
  feedSort: "newest" | "confidence";
  searchInputRef: RefObject<HTMLInputElement | null>;
  presets: FilterPreset[];
  scenarioPresets: ScenarioPreset[];
  activeFilters: Array<{ id: string; label: string; clear: () => void }>;
  onTimeWindowChange: (tw: TimeWindow) => void;
  onCategoryChange: (cat: string) => void;
  onJurisdictionChange: (jur: string) => void;
  onLanguageChange: (lang: string) => void;
  onSearchChange: (q: string) => void;
  onFeedSortChange: (sort: "newest" | "confidence") => void;
  onSavePreset: () => void;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (id: string) => void;
  onApplyScenario: (scenario: ScenarioPreset) => void;
  onClearFilters: () => void;
}

export function CommandBar({
  mode,
  timeWindow,
  category,
  jurisdiction,
  language,
  search,
  feedSort,
  searchInputRef,
  presets,
  scenarioPresets,
  activeFilters,
  onTimeWindowChange,
  onCategoryChange,
  onJurisdictionChange,
  onLanguageChange,
  onSearchChange,
  onFeedSortChange,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  onApplyScenario,
  onClearFilters,
}: CommandBarProps) {
  const t = useTranslations();
  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const [scenariosOpen, setScenariosOpen] = useState(false);

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

  const gridCols = mode === "research" ? "md:grid-cols-3 lg:grid-cols-5" : "md:grid-cols-3";

  return (
    <div className="command-bar dd-command-bar dd-command-surface z-20">
      <div
        className={`dd-command-grid mx-auto grid max-w-[1720px] grid-cols-1 gap-3 px-4 py-3 ${gridCols}`}
      >
        <label className="dd-filter-field text-body">
          <div className="mb-1.5 text-textMuted">
            {t("filters.timeWindow")}
          </div>
          <select
            className="w-full rounded-lg border border-transparent bg-surfaceInset px-3 py-2.5 text-body outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            value={timeWindow}
            onChange={(e) => onTimeWindowChange(e.target.value as TimeWindow)}
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="15d">Last 2 weeks</option>
            <option value="30d">Last month</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
            <option value="2y">Last 2 years</option>
            <option value="5y">Last 5 years</option>
          </select>
        </label>
        {mode === "research" && (
          <label className="dd-filter-field text-body">
            <div className="mb-1.5 text-textMuted">
              {t("filters.category")}
            </div>
            <select
              className="w-full rounded-lg border border-transparent bg-surfaceInset px-3 py-2.5 text-body outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">All Topics</option>
              <option value="policy">Government</option>
              <option value="research">Science &amp; Tech</option>
              <option value="industry">Business</option>
              <option value="funding">Grants</option>
              <option value="news">In the News</option>
              <option value="incidents">Alerts</option>
            </select>
          </label>
        )}
        {mode === "research" && (
          <label className="dd-filter-field text-body">
            <div className="mb-1.5 text-textMuted">
              {t("filters.region")}
            </div>
            <select
              className="w-full rounded-lg border border-transparent bg-surfaceInset px-3 py-2.5 text-body outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              value={jurisdiction}
              onChange={(e) => onJurisdictionChange(e.target.value)}
            >
              <option value="">All</option>
              <option value="Canada">Federal / National</option>
              <option value="Ontario">Ontario</option>
              <option value="Quebec">Quebec</option>
              <option value="British Columbia">British Columbia</option>
              <option value="Alberta">Alberta</option>
              <option value="Manitoba">Manitoba</option>
              <option value="Saskatchewan">Saskatchewan</option>
              <option value="Nova Scotia">Nova Scotia</option>
              <option value="New Brunswick">New Brunswick</option>
              <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
              <option value="Prince Edward Island">Prince Edward Island</option>
              <option value="Northwest Territories">Northwest Territories</option>
              <option value="Nunavut">Nunavut</option>
              <option value="Yukon">Yukon</option>
            </select>
          </label>
        )}
        {mode === "research" && (
          <label className="dd-filter-field text-body">
            <div className="mb-1.5 text-textMuted">
              {t("feed.language")}
            </div>
            <select
              className="w-full rounded-lg border border-transparent bg-surfaceInset px-3 py-2.5 text-body outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              <option value="">All</option>
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="other">Other</option>
            </select>
          </label>
        )}
        <label className="dd-filter-field text-body">
          <div className="mb-1.5 text-textMuted">
            {t("filters.keyword")}
          </div>
          <div className="dd-search-frame flex items-center rounded-lg bg-surfaceInset px-3 ring-1 ring-transparent transition-all focus-within:ring-primary/20">
            <Search size={16} color="var(--text-muted)" />
            <input
              ref={searchInputRef}
              className="w-full border-none bg-transparent px-2 py-2.5 text-body text-text outline-none"
              placeholder={t("filters.keywordPlaceholder")}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="mt-1 text-micro text-textMuted">
            {t("filters.shortcuts")}
          </div>
        </label>
        <label className="dd-filter-field text-body">
          <div className="mb-1.5 text-textMuted">{t("feed.sort")}</div>
          <select
            className="w-full rounded-lg border border-transparent bg-surfaceInset px-3 py-2.5 text-body outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            value={feedSort}
            onChange={(e) =>
              onFeedSortChange(e.target.value as "newest" | "confidence")
            }
          >
            <option value="newest">{t("feed.sortNewest")}</option>
            <option value="confidence">{t("feed.sortConfidence")}</option>
          </select>
        </label>
      </div>
      <div className="dd-command-actions dd-control-actions mx-auto flex max-w-[1720px] flex-wrap items-center gap-2 px-4 pb-3">
        <button
          onClick={onSavePreset}
          className="btn-ghost"
        >
          <Bookmark size={12} />
          {t("filters.savePreset")}
        </button>
        <button
          onClick={onClearFilters}
          className="btn-ghost"
        >
          <RotateCcw size={12} />
          {t("filters.clear")}
        </button>
        <button
          onClick={copyShareLink}
          className="btn-ghost"
        >
          <Share2 size={12} />
          {shareState === "copied"
            ? t("filters.shareCopied")
            : shareState === "failed"
              ? t("filters.shareFailed")
              : t("filters.share")}
        </button>
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="badge badge-neutral flex items-center gap-1 cursor-pointer"
          >
            <button
              onClick={() => onApplyPreset(preset)}
              className="text-left"
            >
              {preset.name}
            </button>
            <button
              onClick={() => onDeletePreset(preset.id)}
              aria-label={`${t("filters.deletePreset")} ${preset.name}`}
              className="opacity-60 hover:opacity-100 hover:text-[var(--incidents)]"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
      {activeFilters.length > 0 && (
        <div className="dd-command-active dd-control-chips mx-auto flex max-w-[1720px] flex-wrap items-center gap-2 px-4 pb-2">
          {activeFilters.map((chip) => (
            <button
              key={chip.id}
              onClick={chip.clear}
              className="badge badge-neutral cursor-pointer group"
            >
              {chip.label}
              <X size={10} className="opacity-60 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}
      <div className="dd-command-scenarios dd-control-scenarios mx-auto max-w-[1720px] px-4 pb-2">
        <button
          onClick={() => setScenariosOpen((prev) => !prev)}
          className="btn-ghost dd-scenarios-toggle mb-2 text-micro"
          aria-expanded={scenariosOpen}
          aria-controls="scenario-drawer"
        >
          <Filter size={12} />
          {t("filters.scenarios") ?? "Scenarios"}
          {scenariosOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      {scenariosOpen && (
        <>
          <button
            className="dd-scenarios-overlay"
            aria-label="Close scenarios"
            onClick={() => setScenariosOpen(false)}
          />
          <aside id="scenario-drawer" className="dd-scenarios-drawer" role="dialog" aria-modal="true">
            <div className="dd-scenarios-drawer-header">
              <p className="dd-scenarios-drawer-title">{t("filters.scenarios") ?? "Scenarios"}</p>
              <button
                onClick={() => setScenariosOpen(false)}
                className="btn-icon dd-scenarios-close"
                aria-label="Close scenarios"
              >
                <X size={14} />
              </button>
            </div>
            <div className="dd-scenarios-drawer-body">
              <div className="dd-scenario-grid grid grid-cols-1 gap-2">
                {scenarioPresets.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      onApplyScenario(scenario);
                      setScenariosOpen(false);
                    }}
                    className="dd-scenario-card rounded-xl border border-borderSoft bg-surfaceInset p-4 text-left transition-all hover:bg-bgSubtle"
                  >
                    <p className="dd-scenario-title font-medium">
                      {t(`scenarios.${scenario.labelKey}`)}
                    </p>
                    <p className="dd-scenario-desc mt-1 text-textMuted">
                      {t(`scenarios.${scenario.descriptionKey}`)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
