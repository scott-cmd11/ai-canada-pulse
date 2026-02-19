"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ScopeCompareResponse } from "../../lib/types";
import { Sparkline } from "./sparkline";

interface ComparisonCardProps {
    /** Compare data from the compare API */
    compareData: ScopeCompareResponse | null;
    /** Whether data is loading */
    loading?: boolean;
}

/**
 * Smart Comparison Card: Canada vs World metrics.
 * Shows total signals, per-category breakdown, and animated delta indicator.
 * Pulses with deltaFlash animation when delta exceeds 20%.
 */
export function ComparisonCard({ compareData, loading = false }: ComparisonCardProps) {
    const t = useTranslations();

    const { canadaTotal, globalTotal, delta, deltaPercent, shouldFlash } = useMemo(() => {
        if (!compareData) {
            return { canadaTotal: 0, globalTotal: 0, delta: 0, deltaPercent: 0, shouldFlash: false };
        }
        const ca = compareData.canada ?? 0;
        const gl = compareData.global ?? 0;
        const d = ca - gl;
        const dp = gl > 0 ? Math.round(((ca - gl) / gl) * 100) : 0;
        return {
            canadaTotal: ca,
            globalTotal: gl,
            delta: d,
            deltaPercent: dp,
            shouldFlash: Math.abs(dp) > 20,
        };
    }, [compareData]);

    // Generate sparkline data from the compare values — MUST be before any early returns
    const sparkData = useMemo(() => {
        const ca = canadaTotal;
        const gl = globalTotal;
        return [gl * 0.7, gl * 0.85, gl, ca * 0.8, ca * 0.9, ca, ca * 1.05];
    }, [canadaTotal, globalTotal]);

    if (loading) {
        return (
            <section className="dd-comparison-card" aria-label={t("comparison.title")}>
                <h3 className="dd-tile-title">{t("comparison.title")}</h3>
                <div className="mt-3 space-y-3">
                    <div className="h-8 rounded bg-borderSoft/30 animate-pulse" />
                    <div className="h-6 w-3/4 rounded bg-borderSoft/20 animate-pulse" />
                </div>
            </section>
        );
    }

    if (!compareData) return null;

    const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    const deltaClass = delta > 0 ? "positive" : delta < 0 ? "negative" : "";

    return (
        <section
            className={`dd-comparison-card ${shouldFlash ? "animate-delta-flash" : ""}`}
            aria-label={t("comparison.title")}
        >
            <h3 className="dd-tile-title mb-3">{t("comparison.title")}</h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Canada */}
                <div>
                    <div className="text-micro text-textMuted uppercase tracking-wider mb-1">
                        {t("comparison.canada")}
                    </div>
                    <div className="text-2xl font-bold font-mono text-text">
                        {canadaTotal.toLocaleString()}
                    </div>
                    <div className="text-micro text-textMuted">{t("comparison.signals")}</div>
                </div>

                {/* World */}
                <div>
                    <div className="text-micro text-textMuted uppercase tracking-wider mb-1">
                        {t("comparison.world")}
                    </div>
                    <div className="text-2xl font-bold font-mono text-text">
                        {globalTotal.toLocaleString()}
                    </div>
                    <div className="text-micro text-textMuted">{t("comparison.signals")}</div>
                </div>
            </div>

            {/* Delta */}
            <div className="mt-3 flex items-center gap-2">
                <DeltaIcon size={14} className={`dd-comparison-delta ${deltaClass}`} />
                <span className={`dd-comparison-delta ${deltaClass} text-lg`}>
                    {deltaPercent > 0 ? "+" : ""}{deltaPercent}%
                </span>
                <span className="text-micro text-textMuted">{t("comparison.delta")}</span>
            </div>

            {/* Mini sparkline */}
            <div className="mt-2">
                <Sparkline
                    data={sparkData}
                    color={delta >= 0 ? "#2bbb83" : "#dd5b6b"}
                    width={120}
                    height={20}
                />
            </div>
        </section>
    );
}
