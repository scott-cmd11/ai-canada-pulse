import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BookOpen,
  Landmark,
  Newspaper,
  Globe,
  Github,
  FileText,
  Download,
  BarChart3,
  Shield,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { MethodsShell } from "../../../components/methods-shell";

const sourceIcons = [
  { key: "openalex", Icon: BookOpen, color: "var(--research)" },
  { key: "govCanada", Icon: Landmark, color: "var(--policy)" },
  { key: "betakit", Icon: Newspaper, color: "var(--news)" },
  { key: "googleNews", Icon: Globe, color: "var(--news)" },
  { key: "github", Icon: Github, color: "var(--industry)" },
  { key: "arxiv", Icon: FileText, color: "var(--research)" },
];

const pipelineSteps = [
  { key: "collect", Icon: Download, color: "var(--research)" },
  { key: "score", Icon: BarChart3, color: "var(--policy)" },
  { key: "categorize", Icon: Shield, color: "var(--industry)" },
  { key: "display", Icon: Globe, color: "var(--news)" },
];

const numberKeys = ["signal", "confidence", "hhi", "riskIndex", "momentum"] as const;
const limitationKeys = ["a", "b", "c", "d"] as const;
const faqKeys = ["1", "2", "3", "4"] as const;

export default async function MethodsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "methods" });

  return (
    <MethodsShell>
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header */}
      <section className="elevated rounded-2xl border border-borderSoft bg-surface p-6">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-textSecondary">{t("body")}</p>
      </section>

      {/* Data Sources */}
      <section className="elevated rounded-2xl border border-borderSoft bg-surface p-6">
        <h2 className="text-xl font-semibold">{t("dataSources.title")}</h2>
        <p className="mt-2 text-sm text-textSecondary">{t("dataSources.intro")}</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sourceIcons.map(({ key, Icon, color }) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-lg border border-borderSoft bg-bg p-4"
            >
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-sm text-textSecondary">{t(`dataSources.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="elevated rounded-2xl border border-borderSoft bg-surface p-6">
        <h2 className="text-xl font-semibold">{t("pipeline.title")}</h2>
        <p className="mt-2 text-sm text-textSecondary">{t("pipeline.intro")}</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pipelineSteps.map(({ key, Icon, color }, i) => (
            <div key={key} className="relative">
              <div className="rounded-lg border border-borderSoft bg-bg p-4">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {i + 1}
                  </div>
                  <Icon size={16} style={{ color }} />
                  <span className="font-semibold text-text">{t(`pipeline.${key}`)}</span>
                </div>
                <p className="mt-2 text-xs text-textSecondary">{t(`pipeline.${key}Desc`)}</p>
              </div>
              {i < pipelineSteps.length - 1 && (
                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-textMuted lg:block">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* What the Numbers Mean */}
      <section className="elevated rounded-2xl border border-borderSoft bg-surface p-6">
        <h2 className="text-xl font-semibold">{t("numbers.title")}</h2>
        <p className="mt-2 text-sm text-textSecondary">{t("numbers.intro")}</p>
        <div className="mt-4 space-y-3">
          {numberKeys.map((key) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-lg border border-borderSoft bg-bg p-4"
            >
              <HelpCircle size={16} className="mt-0.5 shrink-0 text-textMuted" />
              <p className="text-sm text-textSecondary">{t(`numbers.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Limitations */}
      <section className="elevated rounded-2xl border border-borderSoft bg-surface p-6">
        <h2 className="text-xl font-semibold">{t("limitations.title")}</h2>
        <p className="mt-2 text-sm text-textSecondary">{t("limitations.intro")}</p>
        <ul className="mt-4 space-y-2">
          {limitationKeys.map((key) => (
            <li
              key={key}
              className="flex items-start gap-3 rounded-lg border border-borderSoft bg-bg p-3 text-sm text-textSecondary"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--incidents)]" />
              {t(`limitations.${key}`)}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="elevated rounded-2xl border border-borderSoft bg-surface p-6">
        <h2 className="text-xl font-semibold">{t("faq.title")}</h2>
        <div className="mt-4 space-y-4">
          {faqKeys.map((n) => (
            <details
              key={n}
              className="group rounded-lg border border-borderSoft bg-bg"
            >
              <summary className="cursor-pointer p-4 text-sm font-medium text-text">
                {t(`faq.q${n}`)}
              </summary>
              <p className="border-t border-borderSoft px-4 pb-4 pt-3 text-sm text-textSecondary">
                {t(`faq.a${n}`)}
              </p>
            </details>
          ))}
        </div>
      </section>

    </div>
    </MethodsShell>
  );
}
