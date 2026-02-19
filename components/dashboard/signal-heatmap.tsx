"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { EChartsResponse } from "../../lib/types";

interface SignalHeatmapProps {
    /** Hourly data from the hourly API */
    hourlyData: EChartsResponse | null;
    /** Category for active filter */
    activeCategory: string;
    /** Callback when clicking a heatmap cell */
    onCellClick: (timeSlot: string, category: string) => void;
    /** Whether data is loading */
    loading?: boolean;
}

/**
 * Signal Heatmap: time (columns) × category (rows) grid.
 * Color intensity = signal density.
 * Clicking a cell filters the feed to that time+category slice.
 */
export function SignalHeatmap({
    hourlyData,
    activeCategory,
    onCellClick,
    loading = false,
}: SignalHeatmapProps) {
    const t = useTranslations();

    // Category colors for heatmap rows
    const categoryColors: Record<string, string> = {
        "Policy & Regulation": "#3174d4",
        "Industry & Economy": "#1ea86d",
        "Research & Innovation": "#9b59b6",
        "Ethics & Society": "#e67e22",
        "Infrastructure & Compute": "#2a9d8f",
        "Security & Defence": "#d95a67",
        "Talent & Education": "#4585df",
        "International": "#6c5ce7",
    };

    // Parse hourly data into a heatmap grid
    const { categories, timeSlots, grid, maxValue } = useMemo(() => {
        if (!hourlyData?.series || !hourlyData?.xAxis) {
            return { categories: [] as string[], timeSlots: [] as string[], grid: {} as Record<string, Record<string, number>>, maxValue: 1 };
        }

        const cats = hourlyData.series.map((s) => s.name);
        // Show last 12 time slots to keep it compact
        const slots = hourlyData.xAxis.slice(-12);
        const slotStart = hourlyData.xAxis.length - 12;

        const g: Record<string, Record<string, number>> = {};
        let max = 1;

        for (const series of hourlyData.series) {
            g[series.name] = {};
            for (let i = 0; i < slots.length; i++) {
                const dataIdx = slotStart + i;
                const val = series.data[dataIdx] ?? 0;
                g[series.name][slots[i]] = val;
                if (val > max) max = val;
            }
        }

        return { categories: cats, timeSlots: slots, grid: g, maxValue: max };
    }, [hourlyData]);

    if (loading) {
        return (
            <section className="dd-tile p-4" aria-label={t("heatmap.title")}>
                <h3 className="dd-tile-title">{t("heatmap.title")}</h3>
                <div className="mt-3 space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-6 rounded bg-borderSoft/30 animate-pulse" />
                    ))}
                </div>
            </section>
        );
    }

    if (categories.length === 0 || timeSlots.length === 0) {
        return null;
    }

    // Format time label for display (e.g., "14:00" → "14h")
    const formatTimeLabel = (slot: string) => {
        if (slot.includes(":")) {
            return slot.split(":")[0] + "h";
        }
        // If it's a date, show short
        if (slot.includes("-")) {
            const parts = slot.split("-");
            return `${parts[1]}/${parts[2]}`;
        }
        return slot;
    };

    return (
        <section className="dd-tile p-4 overflow-x-auto" aria-label={t("heatmap.title")}>
            <h3 className="dd-tile-title">{t("heatmap.title")}</h3>
            <div
                className="mt-3 grid gap-px"
                style={{
                    gridTemplateColumns: `120px repeat(${timeSlots.length}, minmax(28px, 1fr))`,
                }}
                role="grid"
                aria-label="Signal intensity by time and category"
            >
                {/* Header row: time labels */}
                <div className="text-micro text-textMuted" role="columnheader" />
                {timeSlots.map((slot) => (
                    <div
                        key={slot}
                        className="text-center text-micro text-textMuted font-mono truncate px-0.5"
                        role="columnheader"
                    >
                        {formatTimeLabel(slot)}
                    </div>
                ))}

                {/* Data rows: one per category */}
                {categories.map((cat) => {
                    const color = categoryColors[cat] ?? "#7783a1";
                    return (
                        <div key={cat} className="contents" role="row">
                            <div
                                className="text-micro text-textMuted truncate pr-2 flex items-center"
                                role="rowheader"
                                title={cat}
                            >
                                <span
                                    className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                                    style={{ background: color }}
                                    aria-hidden="true"
                                />
                                <span className="truncate">{cat}</span>
                            </div>
                            {timeSlots.map((slot) => {
                                const value = grid[cat]?.[slot] ?? 0;
                                const intensity = maxValue > 0 ? value / maxValue : 0;
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={`${cat}-${slot}`}
                                        className={`dd-heatmap-cell min-h-[24px] ${isActive ? "ring-1 ring-primary/50" : ""}`}
                                        style={{
                                            background: value > 0
                                                ? `color-mix(in oklab, ${color} ${Math.round(20 + intensity * 70)}%, transparent)`
                                                : "transparent",
                                        }}
                                        onClick={() => onCellClick(slot, cat)}
                                        role="gridcell"
                                        aria-label={`${cat}, ${slot}: ${value} signals`}
                                        title={`${value} signals`}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
