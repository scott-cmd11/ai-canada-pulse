"use client";

import { useEffect, useState } from "react";

export function Delta({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span style={{ color: positive ? "var(--status-positive)" : "var(--status-negative)" }}>
      {positive ? "+" : ""}
      {value.toFixed(1)}%{" "}
      <span aria-hidden="true">{positive ? "\u25B2" : "\u25BC"}</span>
    </span>
  );
}

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return (
    <div
      className="h-3 rounded-md"
      style={{
        width,
        background:
          "linear-gradient(90deg, var(--bg-subtle) 25%, var(--surface-raised) 50%, var(--bg-subtle) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s ease-in-out infinite",
      }}
    />
  );
}

export function RelativeTime({ value }: { value: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const render = () => {
      const seconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(value).getTime()) / 1000)
      );
      if (seconds < 60) return setLabel(`${seconds}s ago`);
      if (seconds < 3600) return setLabel(`${Math.floor(seconds / 60)}m ago`);
      if (seconds < 86400)
        return setLabel(`${Math.floor(seconds / 3600)}h ago`);
      return setLabel(`${Math.floor(seconds / 86400)}d ago`);
    };
    render();
    const timer = setInterval(render, 30000);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{label}</span>;
}
