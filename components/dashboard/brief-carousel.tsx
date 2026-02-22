"use client";

import { useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StatsBriefResponse } from "../../lib/types";

interface SummaryData {
    bullets?: string[];
}

interface BriefCarouselProps {
    /** Summary data (can be null) */
    summary: SummaryData | null;
    /** Brief data from the brief API */
    brief: StatsBriefResponse | null;
    /** Whether data is loading */
    loading?: boolean;
}

/**
 * Morning Brief Card Carousel: horizontal scrollable card stack.
 * Each card = one key insight with category badge, confidence score, and text.
 * Navigation: arrow buttons + keyboard arrows. Touch-swipeable (CSS scroll-snap).
 */
export function BriefCarousel({ summary, brief, loading = false }: BriefCarouselProps) {
    const t = useTranslations();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Build insight cards from summary bullets and brief data
    const cards = useMemo(() => {
        const result: { text: string; category: string; confidence: number }[] = [];

        // Add summary bullets
        if (summary?.bullets) {
            for (const bullet of summary.bullets) {
                result.push({
                    text: bullet,
                    category: "Summary",
                    confidence: 0.85,
                });
            }
        }

        // Add brief top items
        if (brief?.top_category?.name) {
            result.push({
                text: `Leading category: ${brief.top_category.name} with ${brief.total_items ?? 0} signals detected.`,
                category: brief.top_category.name,
                confidence: 0.9,
            });
        }

        if (brief?.top_jurisdiction?.name) {
            result.push({
                text: `Most active region: ${brief.top_jurisdiction.name}`,
                category: "Regional",
                confidence: 0.88,
            });
        }

        if (brief?.high_alert_count && brief.high_alert_count > 0) {
            result.push({
                text: `${brief.high_alert_count} high-priority alert${brief.high_alert_count > 1 ? "s" : ""} detected in this period.`,
                category: "Alert",
                confidence: 0.95,
            });
        }

        return result;
    }, [summary, brief]);

    const scroll = useCallback((direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const amount = 340;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    }, []);

    if (loading) {
        return (
            <section className="dd-tile p-4" aria-label={t("briefCarousel.title")}>
                <h3 className="dd-tile-title">{t("briefCarousel.title")}</h3>
                <div className="dd-brief-carousel mt-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="dd-brief-card animate-pulse" style={{ minHeight: 120 }}>
                            <div className="h-4 w-20 rounded bg-borderSoft/30 mb-3" />
                            <div className="h-3 w-full rounded bg-borderSoft/20 mb-2" />
                            <div className="h-3 w-3/4 rounded bg-borderSoft/20" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (cards.length === 0) return null;

    // Category color map
    const catColors: Record<string, string> = {
        "Policy & Regulation": "#3174d4",
        "Industry & Economy": "#1ea86d",
        "Research & Innovation": "#9b59b6",
        "Ethics & Society": "#e67e22",
        "Infrastructure & Compute": "#2a9d8f",
        "Security & Defence": "#d95a67",
        "Summary": "#1d4ed8",
        "Regional": "#2a9d8f",
        "Alert": "#d95a67",
    };

    return (
        <section className="dd-tile p-4" aria-label={t("briefCarousel.title")}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="dd-tile-title mb-0">{t("briefCarousel.title")}</h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => scroll("left")}
                        className="btn-ghost p-1.5 rounded-lg"
                        aria-label={t("briefCarousel.prev")}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="btn-ghost p-1.5 rounded-lg"
                        aria-label={t("briefCarousel.next")}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
            <div
                ref={scrollRef}
                className="dd-brief-carousel"
                role="region"
                aria-label="Brief insights"
                onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") scroll("left");
                    if (e.key === "ArrowRight") scroll("right");
                }}
                tabIndex={0}
            >
                {cards.map((card, i) => {
                    const color = catColors[card.category] ?? "#7783a1";
                    return (
                        <article
                            key={i}
                            className={`dd-brief-card animate-stagger-fade stagger-${Math.min(i + 1, 8)}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className="badge badge-category rounded-full"
                                    style={{ "--badge-color": color } as React.CSSProperties}
                                >
                                    {card.category}
                                </span>
                                <span className="font-mono text-micro text-textMuted">
                                    {Math.round(card.confidence * 100)}%
                                </span>
                            </div>
                            <p className="text-body text-textSecondary leading-relaxed">
                                {card.text}
                            </p>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
