"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "./theme-provider";
import { DashboardShell } from "./dashboard/shell";

export function MethodsShell({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations();
  const { theme, toggleTheme } = useTheme();
  const otherLocale = locale === "en" ? "fr" : "en";

  return (
    <DashboardShell
      locale={locale}
      activeScope="methods"
      navLabels={{
        canada: t("nav.canada"),
        methods: t("nav.methods"),
      }}
      otherLocale={otherLocale}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {children}
    </DashboardShell>
  );
}
