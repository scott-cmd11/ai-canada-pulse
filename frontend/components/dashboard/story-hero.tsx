"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { KPIsResponse, JurisdictionsBreakdownResponse, StatsAlertItem, TimeWindow } from "../../lib/types";

interface StoryHeroProps {
  scope: "canada" | "world";
  timeWindow: TimeWindow;
  kpis: KPIsResponse | null;
  jurisdictionsBreakdown: JurisdictionsBreakdownResponse | null;
  alerts: StatsAlertItem[];
  totalSignals: number;
}

const timeWindowKeys: Record<TimeWindow, string> = {
  "1h": "storyHero.timeWindow1h",
  "24h": "storyHero.timeWindow24h",
  "7d": "storyHero.timeWindow7d",
  "30d": "storyHero.timeWindow30d",
  "90d": "storyHero.timeWindow90d",
  "1y": "storyHero.timeWindow1y",
  "2y": "storyHero.timeWindow2y",
  "5y": "storyHero.timeWindow5y",
};

export function StoryHero({
  scope,
  timeWindow,
  kpis,
  jurisdictionsBreakdown,
  alerts,
  totalSignals,
}: StoryHeroProps) {
  const t = useTranslations();
  const timeWindowLabel = t(timeWindowKeys[timeWindow] ?? "storyHero.timeWindow24h");
  const highAlertCount = alerts.filter((a) => a.severity === "high").length;
  const delta7d = kpis?.d7?.delta_percent ?? 0;

  const narrative = useMemo(() => {
    const parts: string[] = [];

    const region = scope === "canada" ? t("storyHero.regionCanada") : t("storyHero.regionGlobal");

    if (totalSignals > 0) {
      parts.push(
        t("storyHero.detected", {
          window: timeWindowLabel,
          count: totalSignals.toLocaleString(),
          region,
        })
      );
    } else {
      parts.push(
        t("storyHero.noSignals", { region, window: timeWindowLabel })
      );
      return parts;
    }

    // Trend direction
    const d7 = kpis?.d7;
    if (d7) {
      if (d7.delta_percent > 10) {
        parts.push(t("storyHero.activityUp", { percent: d7.delta_percent.toFixed(1) }));
      } else if (d7.delta_percent < -10) {
        parts.push(t("storyHero.activityDown", { percent: Math.abs(d7.delta_percent).toFixed(1) }));
      } else {
        parts.push(t("storyHero.activityStable"));
      }
    }

    // Top jurisdiction
    const topJurisdiction = jurisdictionsBreakdown?.jurisdictions?.[0];
    if (topJurisdiction && topJurisdiction.count > 0) {
      parts.push(
        t("storyHero.topJurisdiction", {
          name: topJurisdiction.name,
          count: topJurisdiction.count,
        })
      );
    }

    // Alert info
    const highAlerts = alerts.filter((a) => a.severity === "high");
    if (highAlerts.length > 0) {
      const top = highAlerts[0];
      const key = top.direction === "up" ? "storyHero.alertSpike" : "storyHero.alertDrop";
      parts.push(
        t(key, {
          category: top.category,
          percent: Math.abs(top.delta_percent).toFixed(1),
        })
      );
    }

    return parts;
  }, [scope, timeWindowLabel, kpis, jurisdictionsBreakdown, alerts, totalSignals, t]);

  return (
    <section className="story-hero dd-hero-card elevated p-5 md:p-6">
      <div className="dd-hero-grid">
        <div className="dd-hero-main">
          <h1 className="dd-hero-title">{scope === "canada" ? t("hero.canadaHeadline") : t("hero.globalHeadline")}</h1>
          <p className="dd-hero-subtitle">{t("hero.subtitle")}</p>
        </div>
        <div className="dd-hero-stats">
          <div className="dd-hero-chip">
            <span>{t("filters.timeWindow")}</span>
            <strong>{timeWindowLabel}</strong>
          </div>
          <div className="dd-hero-chip">
            <span>{t("global.latestSignals")}</span>
            <strong>{totalSignals.toLocaleString()}</strong>
          </div>
          <div className="dd-hero-chip">
            <span>{t("alerts.title")}</span>
            <strong>{highAlertCount.toLocaleString()}</strong>
          </div>
          <div className={`dd-hero-chip ${delta7d >= 0 ? "is-positive" : "is-negative"}`}>
            <span>{t("kpi.new7d")}</span>
            <strong>
              {delta7d >= 0 ? "+" : ""}
              {delta7d.toFixed(1)}%
            </strong>
          </div>
        </div>
      </div>
      {narrative.length > 0 ? (
        <p className="dd-hero-narrative">{narrative[0]}</p>
      ) : null}
    </section>
  );
}

