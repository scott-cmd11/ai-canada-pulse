"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Activity, BarChart3, Globe2, Landmark, Menu, Moon, Sun, X } from "lucide-react";
import { useTranslations } from "next-intl";

type Scope = "canada" | "world";

interface DashboardShellProps {
  locale: string;
  activeScope: Scope;
  navLabels: {
    canada: string;
    world: string;
    methods: string;
  };
  otherLocale: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  headerMeta?: ReactNode;
  headerActions?: ReactNode;
  guidePanel?: ReactNode;
  utilityBar?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({
  locale,
  activeScope,
  navLabels,
  otherLocale,
  theme,
  onToggleTheme,
  headerMeta,
  headerActions,
  guidePanel,
  utilityBar,
  children,
}: DashboardShellProps) {
  const [railOpen, setRailOpen] = useState(false);
  const t = useTranslations();
  const railBrand = "AI Pulse";

  return (
    <div className={`pulse-shell dd-shell ${railOpen ? "dd-rail-open" : ""}`}>
      <button
        onClick={() => setRailOpen(false)}
        className="dd-rail-scrim"
        aria-hidden={!railOpen}
        tabIndex={-1}
      />
      <aside className="dd-rail" aria-label="Dashboard navigation">
        <div className="dd-rail-brand-wrap">
          <div className="dd-rail-logo" aria-hidden="true">
            <Activity size={14} />
          </div>
          <div>
            <div className="dd-rail-brand">{railBrand}</div>
          </div>
          <button
            onClick={() => setRailOpen(false)}
            className="dd-rail-close"
            aria-label="Close navigation"
          >
            <X size={14} />
          </button>
        </div>
        <div className="dd-rail-section-title">{t("shell.dashboards")}</div>
        <nav className="dd-rail-nav">
          <Link
            href={`/${locale}/canada`}
            className={`dd-rail-link ${activeScope === "canada" ? "active" : ""}`}
            onClick={() => setRailOpen(false)}
          >
            <Landmark size={14} />
            {navLabels.canada}
          </Link>
          <Link
            href={`/${locale}/world`}
            className={`dd-rail-link ${activeScope === "world" ? "active" : ""}`}
            onClick={() => setRailOpen(false)}
          >
            <Globe2 size={14} />
            {navLabels.world}
          </Link>
        </nav>
        <div className="dd-rail-section-title">{t("shell.reference")}</div>
        <nav className="dd-rail-nav">
          <Link
            href={`/${locale}/methods`}
            className="dd-rail-link"
            onClick={() => setRailOpen(false)}
          >
            <BarChart3 size={14} />
            {navLabels.methods}
          </Link>
        </nav>
        <div className="dd-rail-footer">
          <span className="dd-status-dot" aria-hidden="true" />
          {t("shell.liveStream")}
        </div>
      </aside>
      <div className="dd-main">
        <header className="dd-topbar">
          <div className="dd-topbar-left">
            <button
              onClick={() => setRailOpen((prev) => !prev)}
              className="dd-rail-toggle"
              aria-label="Toggle navigation"
            >
              <Menu size={14} />
            </button>
            <span className="dd-scope-pill">
              {activeScope === "canada" ? navLabels.canada : navLabels.world}
            </span>
          </div>
          <div className="dd-topbar-center">{headerMeta}</div>
          <div className="dd-topbar-actions">
            {headerActions}
            <button onClick={onToggleTheme} className="nav-button" aria-label="Toggle theme">
              {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <Link href={`/${otherLocale}/${activeScope}`} className="nav-button">
              {otherLocale.toUpperCase()}
            </Link>
          </div>
        </header>
        {guidePanel}
        {utilityBar ? <div className="dd-utility-row">{utilityBar}</div> : null}
        <div className="dd-content">{children}</div>
        <footer className="dd-disclaimer">
          <p>This dashboard was built with AI assistance. Data is aggregated from public sources and may not be comprehensive.</p>
        </footer>
      </div>
    </div>
  );
}






