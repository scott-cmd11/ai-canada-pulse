"use client";

import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "ai_pulse_welcome_dismissed";

export function WelcomeBanner() {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  }

  if (!visible) return null;

  return (
    <section className="elevated dd-welcome-banner p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="dd-welcome-icon mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primarySubtle">
            <Info size={16} className="text-primary" />
          </div>
          <div>
            <h2 className="dd-welcome-title text-subheading text-text">{t("welcome.title")}</h2>
            <div className="mt-2 space-y-2 text-body text-textSecondary">
              <p>{t("welcome.description")}</p>
              <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-3">
                <div className="dd-welcome-card rounded bg-surfaceInset p-3">
                  <p className="font-medium text-text">{t("welcome.dataSourcesTitle")}</p>
                  <p className="mt-1 text-caption text-textSecondary">{t("welcome.dataSourcesDesc")}</p>
                </div>
                <div className="dd-welcome-card rounded bg-surfaceInset p-3">
                  <p className="font-medium text-text">{t("welcome.howToUseTitle")}</p>
                  <p className="mt-1 text-caption text-textSecondary">{t("welcome.howToUseDesc")}</p>
                </div>
                <div className="dd-welcome-card rounded bg-surfaceInset p-3">
                  <p className="font-medium text-text">{t("welcome.numbersTitle")}</p>
                  <p className="mt-1 text-caption text-textSecondary">{t("welcome.numbersDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="btn-icon shrink-0"
          aria-label={t("welcome.dismiss")}
        >
          <X size={16} />
        </button>
      </div>
      <div className="dd-welcome-footer mt-4 flex items-center gap-3 border-t border-borderSoft/50 pt-4">
        <label className="flex items-center gap-2 text-caption text-textMuted">
          <input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) dismiss();
            }}
            className="rounded"
          />
          {t("welcome.dontShowAgain")}
        </label>
      </div>
    </section>
  );
}
