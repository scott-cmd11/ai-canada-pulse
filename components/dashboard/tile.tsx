"use client";

import type { ReactNode } from "react";

type TileTone = "ok" | "warn" | "critical" | "info" | "neutral";
type TileDensity = "default" | "compact";

interface MetricTileProps {
  label: string;
  value: ReactNode;
  footer?: ReactNode;
  tone?: TileTone;
  loading?: boolean;
  density?: TileDensity;
  spark?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const toneClass: Record<TileTone, string> = {
  ok: "dd-tone-ok",
  warn: "dd-tone-warn",
  critical: "dd-tone-critical",
  info: "dd-tone-info",
  neutral: "dd-tone-neutral",
};

const tileToneClass: Record<TileTone, string> = {
  ok: "dd-tile-tone-ok",
  warn: "dd-tile-tone-warn",
  critical: "dd-tile-tone-critical",
  info: "dd-tile-tone-info",
  neutral: "dd-tile-tone-neutral",
};

export function MetricTile({
  label,
  value,
  footer,
  tone = "neutral",
  loading = false,
  density = "default",
  spark,
  children,
  className = "",
  style,
}: MetricTileProps) {
  return (
    <article
      className={`dd-metric-tile ${toneClass[tone]} ${density === "compact" ? "dd-density-compact" : ""} ${className}`.trim()}
      style={style}
    >
      <h2 className="dd-metric-label">{label}</h2>
      {loading ? (
        <div className="mt-3 space-y-2">
          <div className="dd-skeleton h-7 w-20 rounded" />
          <div className="dd-skeleton h-3 w-28 rounded" />
        </div>
      ) : (
        <>
          <p className="dd-metric-value font-mono">{value}</p>
          {footer ? <div className="dd-metric-footer">{footer}</div> : null}
          {spark ? <div className="dd-metric-spark">{spark}</div> : null}
          {children}
        </>
      )}
    </article>
  );
}

interface TileProps {
  title: ReactNode;
  children: ReactNode;
  tone?: TileTone;
  className?: string;
}

export function Tile({ title, children, tone = "neutral", className = "" }: TileProps) {
  return (
    <section className={`dd-tile ${tileToneClass[tone]} ${className}`.trim()}>
      <h3 className="dd-tile-title">{title}</h3>
      <div className="dd-tile-body">{children}</div>
    </section>
  );
}
