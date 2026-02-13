"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Globe2, Landmark, Moon, Search, Sun } from "lucide-react";

import { exportUrl, fetchFeed, fetchHourly, fetchKpis, fetchWeekly, sseUrl } from "../lib/api";
import type { EChartsResponse, FeedItem, KPIsResponse, TimeWindow } from "../lib/types";
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

function Delta({ value }: { value: number }) {
  const positive = value >= 0;
  return <span style={{ color: positive ? "var(--research)" : "var(--incidents)" }}>{positive ? "+" : ""}{value.toFixed(1)}%</span>;
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

  const otherLocale = locale === "en" ? "fr" : "en";
  const pagePath = scope === "canada" ? "canada" : "world";

  async function refreshData() {
    const [feedResponse, kpiResponse, hourlyResponse, weeklyResponse] = await Promise.all([
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
    ]);
    setFeed(feedResponse.items);
    setKpis(kpiResponse);
    setHourly(hourlyResponse);
    setWeekly(weeklyResponse);
  }

  useEffect(() => {
    refreshData().catch(() => undefined);
  }, [timeWindow, category, jurisdiction, language, search]);

  useEffect(() => {
    const source = new EventSource(sseUrl());
    const handler = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as FeedItem;
        if (scope === "canada" && payload.jurisdiction !== "Canada") return;
        if (scope === "world" && payload.jurisdiction === "Canada") return;
        setFeed((prev) => [payload, ...prev].slice(0, 100));
      } catch {
        return;
      }
    };
    source.addEventListener("new_item", handler);
    return () => source.close();
  }, [scope]);

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

  const hourlyOption = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
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
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
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
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-4">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <article className="rounded-lg border border-borderSoft bg-surface p-4">
            <h2 className="text-sm text-textSecondary">{t("kpi.new15m")}</h2>
            <p className="mt-2 text-3xl font-semibold">{kpis?.m15.current ?? 0}</p>
            <p className="mt-1 text-sm"><Delta value={kpis?.m15.delta_percent ?? 0} /></p>
          </article>
          <article className="rounded-lg border border-borderSoft bg-surface p-4">
            <h2 className="text-sm text-textSecondary">{t("kpi.new1h")}</h2>
            <p className="mt-2 text-3xl font-semibold">{kpis?.h1.current ?? 0}</p>
            <p className="mt-1 text-sm"><Delta value={kpis?.h1.delta_percent ?? 0} /></p>
          </article>
          <article className="rounded-lg border border-borderSoft bg-surface p-4">
            <h2 className="text-sm text-textSecondary">{t("kpi.new7d")}</h2>
            <p className="mt-2 text-3xl font-semibold">{kpis?.d7.current ?? 0}</p>
            <p className="mt-1 text-sm"><Delta value={kpis?.d7.delta_percent ?? 0} /></p>
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

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("feed.live")}</h3>
              {mode === "research" && (
                <div className="flex gap-2">
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
            <div className="max-h-[900px] space-y-3 overflow-y-auto pr-1">
              {feed.map((item) => (
                <article key={item.id} className="rounded-lg border border-borderSoft bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-textMuted">
                    <span>{new Date(item.published_at).toLocaleString()}</span>
                    <span className="rounded-full border px-2 py-0.5" style={{ borderColor: categoryColor[item.category], color: categoryColor[item.category] }}>
                      {item.category}
                    </span>
                    <span>{item.publisher}</span>
                    <span>{item.jurisdiction}</span>
                    <span className="rounded border border-borderSoft px-2">{item.language.toUpperCase()}</span>
                    {mode === "research" && <span>{t("feed.confidence")}: {item.confidence.toFixed(2)}</span>}
                  </div>
                  <h4 className="mt-2 text-lg font-semibold">
                    <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                  </h4>
                  {mode === "research" && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded border border-borderSoft px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setSelected(item)} className="mt-3 rounded border border-borderSoft px-3 py-1.5 text-sm">Details</button>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4 xl:col-span-2">
            <section className="rounded-lg border border-borderSoft bg-surface p-3">
              <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("charts.hourly")}</h3>
              <EChartsReact option={hourlyOption} style={{ height: 280 }} notMerge lazyUpdate />
            </section>
            <section className="rounded-lg border border-borderSoft bg-surface p-3">
              <h3 className="mb-2 text-sm font-semibold text-textSecondary">{t("charts.weekly")}</h3>
              <EChartsReact option={weeklyOption} style={{ height: 320 }} notMerge lazyUpdate />
            </section>
          </div>
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-borderStrong bg-surface p-5">
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <button className="rounded border border-borderSoft px-2 py-1 text-sm" onClick={() => setSelected(null)}>Close</button>
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
