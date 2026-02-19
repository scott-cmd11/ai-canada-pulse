"use client";

import { useMemo } from "react";

interface SparklineProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
    className?: string;
    /** Show a gradient fill under the line */
    fill?: boolean;
}

/**
 * Pure SVG sparkline — no axes, no labels, just the shape of momentum.
 * Designed for inline use next to KPI values.
 */
export function Sparkline({
    data,
    color = "#4585df",
    width = 80,
    height = 28,
    className = "",
    fill = true,
}: SparklineProps) {
    const points = useMemo(() => {
        if (!data || data.length < 2) return "";
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const stepX = width / (data.length - 1);
        const padding = 2; // vertical padding
        const usableHeight = height - padding * 2;

        return data
            .map((val, i) => {
                const x = i * stepX;
                const y = padding + usableHeight - ((val - min) / range) * usableHeight;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
    }, [data, width, height]);

    const fillPath = useMemo(() => {
        if (!points || !fill) return "";
        const padding = 2;
        const usableHeight = height - padding * 2;
        return `M0,${padding + usableHeight} ${points
            .split(" ")
            .map((p) => `L${p}`)
            .join(" ")} L${width},${padding + usableHeight} Z`;
    }, [points, fill, width, height]);

    if (!data || data.length < 2) return null;

    const gradientId = `spark-fill-${color.replace(/[^a-z0-9]/gi, "")}`;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={`inline-block ${className}`}
            aria-hidden="true"
            role="img"
        >
            {fill && (
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                </defs>
            )}
            {fill && fillPath && (
                <path d={fillPath} fill={`url(#${gradientId})`} />
            )}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
