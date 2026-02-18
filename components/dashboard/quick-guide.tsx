"use client";

import { useState, useEffect, useRef } from "react";
import { HelpCircle, X, Zap, BarChart3, SlidersHorizontal, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

const STORAGE_KEY = "ai_pulse_guide_seen";

interface QuickGuideButtonProps {
  onClick: () => void;
}

export function QuickGuideButton({ onClick }: QuickGuideButtonProps) {
  const t = useTranslations("guide");
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setIsNew(true);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <button onClick={onClick} className="nav-button relative" aria-label={t("title")}>
      <HelpCircle size={16} />
      <span className="hidden sm:inline">{t("trigger")}</span>
      {isNew && (
        <span className="guide-new-dot absolute -right-0.5 -top-0.5" />
      )}
    </button>
  );
}

interface QuickGuidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

const guideCards = [
  { titleKey: "whatIsThis", descKey: "whatIsThisDesc", Icon: Zap, color: "var(--gradient-from)" },
  { titleKey: "readingDashboard", descKey: "readingDashboardDesc", Icon: BarChart3, color: "var(--research)" },
  { titleKey: "usingFilters", descKey: "usingFiltersDesc", Icon: SlidersHorizontal, color: "var(--funding)" },
  { titleKey: "modesAndViews", descKey: "modesAndViewsDesc", Icon: Layers, color: "var(--industry)" },
] as const;

export function QuickGuidePanel({ isOpen, onClose, locale }: QuickGuidePanelProps) {
  const t = useTranslations("guide");
  const panelRef = useRef<HTMLDivElement>(null);

  // Mark as seen when opened
  useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* ignore */
      }
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid closing from the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="relative z-40">
      <div
        ref={panelRef}
        className="guide-panel-enter mx-auto max-w-[1460px] border-b border-borderSoft px-4 pb-4 pt-3"
        style={{ background: "var(--surface)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-subheading tracking-tight">{t("title")}</h2>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label={t("close")}
          >
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {guideCards.map(({ titleKey, descKey, Icon, color }) => (
            <div
              key={titleKey}
              className="rounded bg-surfaceInset p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
                <h3 className="text-body font-semibold">{t(titleKey)}</h3>
              </div>
              <p className="text-caption leading-relaxed text-textSecondary">{t(descKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center">
          <Link
            href={`/${locale}/methods`}
            className="text-caption text-textMuted hover:text-primary"
            onClick={onClose}
          >
            {t("learnMore")} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
