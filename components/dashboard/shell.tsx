"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { BarChart3, Landmark, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

type Scope = "canada" | "methods";

interface DashboardShellProps {
  locale: string;
  activeScope: Scope;
  navLabels: {
    canada: string;
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
  const t = useTranslations();

  return (
    <div className={`pulse-shell dd-shell`}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="dd-main">
        <header className="dd-topbar">
          <div className="dd-topbar-left">
            <Link
              href={`/${locale}/canada`}
              className={`nav-button ${activeScope === "canada" ? "is-active" : ""}`}
            >
              <Landmark size={14} />
              {navLabels.canada}
            </Link>
            <Link
              href={`/${locale}/methods`}
              className={`nav-button ${activeScope === "methods" ? "is-active" : ""}`}
            >
              <BarChart3 size={14} />
              {navLabels.methods}
            </Link>
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
        <main id="main-content" className="dd-content">{children}</main>
        <footer className="dd-disclaimer">
          <p>This dashboard was built with AI assistance. Data is aggregated from public sources and may not be comprehensive.</p>
        </footer>
      </div>
    </div>
  );
}
