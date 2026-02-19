"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Zap, ExternalLink } from "lucide-react";
import type { FeedItem } from "../../lib/types";

interface SignalOfDayProps {
    /** All feed items in current window */
    feed: FeedItem[];
    /** Whether data is loading */
    loading?: boolean;
    /** Click handler to open the detail modal */
    onSelect: (item: FeedItem) => void;
}

/**
 * Signal of the Day: highlights the highest-confidence signal
 * with a glowing border animation.
 */
export function SignalOfDay({ feed, loading = false, onSelect }: SignalOfDayProps) {
    const t = useTranslations();

    const topSignal = useMemo(() => {
        if (!feed || feed.length === 0) return null;
        // Pick highest confidence signal
        return feed.reduce((best, item) => {
            const bestScore = best.confidence ?? 0;
            const itemScore = item.confidence ?? 0;
            return itemScore > bestScore ? item : best;
        }, feed[0]);
    }, [feed]);

    if (loading) {
        return (
            <section className="dd-signal-of-day dd-tile p-4" aria-label={t("signalOfDay.title")}>
                <h3 className="dd-tile-title">{t("signalOfDay.title")}</h3>
                <div className="mt-3 space-y-2">
                    <div className="h-5 w-3/4 rounded bg-borderSoft/30 animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-borderSoft/20 animate-pulse" />
                </div>
            </section>
        );
    }

    if (!topSignal) return null;

    const score = topSignal.confidence ?? 0;

    return (
        <section
            className="dd-signal-of-day dd-tile p-4 cursor-pointer"
            aria-label={t("signalOfDay.title")}
            onClick={() => onSelect(topSignal)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(topSignal);
                }
            }}
        >
            <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-yellow-500" />
                <h3 className="dd-tile-title mb-0 text-micro uppercase tracking-wider">
                    {t("signalOfDay.title")}
                </h3>
                <span className="ml-auto font-mono text-micro text-textMuted">
                    {Math.round(score * 100)}% confidence
                </span>
            </div>
            <h4 className="text-body font-semibold text-text leading-snug line-clamp-2">
                {topSignal.title}
            </h4>
            <div className="mt-2 flex items-center gap-3 text-micro text-textMuted">
                {topSignal.publisher && <span>{topSignal.publisher}</span>}
                {topSignal.category && (
                    <span className="px-1.5 py-0.5 rounded bg-borderSoft/30 text-micro">
                        {topSignal.category}
                    </span>
                )}
                {topSignal.url && (
                    <a
                        href={topSignal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink size={12} />
                    </a>
                )}
            </div>
        </section>
    );
}
