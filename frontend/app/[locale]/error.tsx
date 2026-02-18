"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <AlertTriangle
          size={48}
          className="mx-auto mb-4"
          style={{ color: "var(--incidents)" }}
        />
        <h2 className="mb-2 text-xl font-semibold">{t("error.title")}</h2>
        <p className="mb-6 text-sm text-textSecondary">
          {t("error.description")}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded border border-borderStrong px-4 py-2 text-sm font-medium hover:bg-bg"
          >
            <RefreshCw size={16} />
            {t("error.retry")}
          </button>
          <Link
            href={`/${locale}/canada`}
            className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm text-textSecondary hover:text-textPrimary"
          >
            <ArrowLeft size={16} />
            {t("error.backToDashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}
