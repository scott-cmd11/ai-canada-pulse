"use client";

import { useMemo } from "react";

interface PulseIndicatorProps {
    /** SSE connection status */
    status: "connecting" | "live" | "error";
    /** ISO timestamp of the last received signal */
    lastSignalAt: string | null;
    className?: string;
}

/**
 * Animated heartbeat waveform indicating feed health.
 * - Fast pulse: signals arriving frequently (< 10 min)
 * - Slow pulse: quiet period (> 10 min)
 * - Flatline: disconnected or error
 */
export function PulseIndicator({
    status,
    lastSignalAt,
    className = "",
}: PulseIndicatorProps) {
    const minutesSinceSignal = useMemo(() => {
        if (!lastSignalAt) return null;
        const diff = Date.now() - new Date(lastSignalAt).getTime();
        return Math.floor(diff / 60000);
    }, [lastSignalAt]);

    // Determine animation speed based on signal recency
    const animDuration = useMemo(() => {
        if (status !== "live") return "0s"; // flatline
        if (minutesSinceSignal === null) return "2.5s"; // default medium
        if (minutesSinceSignal < 5) return "1.2s"; // fast pulse
        if (minutesSinceSignal < 15) return "2s"; // medium
        if (minutesSinceSignal < 60) return "3.5s"; // slow
        return "5s"; // very slow
    }, [status, minutesSinceSignal]);

    const isAlive = status === "live";
    const dotColor = isAlive ? "#2bbb83" : status === "connecting" ? "#e3a954" : "#dd5b6b";
    const waveColor = isAlive ? "#2bbb83" : "#6d80a7";

    // Generate a simple ECG-like waveform path
    const waveformPath = isAlive
        ? "M0,14 L8,14 L11,6 L14,20 L17,10 L20,14 L28,14 L31,6 L34,20 L37,10 L40,14 L48,14"
        : "M0,14 L48,14"; // flatline

    return (
        <div
            className={`flex items-center gap-1.5 ${className}`}
            role="status"
            aria-label={
                isAlive
                    ? `Feed is live${minutesSinceSignal !== null ? `, last signal ${minutesSinceSignal} minutes ago` : ""}`
                    : status === "connecting"
                        ? "Feed is connecting"
                        : "Feed connection error"
            }
        >
            {/* Status dot */}
            <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                    background: dotColor,
                    boxShadow: isAlive ? `0 0 6px ${dotColor}44` : "none",
                }}
            />

            {/* Waveform */}
            <svg
                width={48}
                height={28}
                viewBox="0 0 48 28"
                className="opacity-70"
                aria-hidden="true"
                style={{
                    animationDuration: animDuration,
                    animationTimingFunction: "ease-in-out",
                    animationIterationCount: "infinite",
                    animationName: isAlive ? "pulseWave" : "none",
                }}
            >
                <path
                    d={waveformPath}
                    fill="none"
                    stroke={waveColor}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}
