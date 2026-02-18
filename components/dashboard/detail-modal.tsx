"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, X, ChevronDown, ChevronUp, Check, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FeedItem } from "../../lib/types";

interface DetailModalProps {
  item: FeedItem;
  onClose: () => void;
}

export function DetailModal({ item, onClose }: DetailModalProps) {
  const t = useTranslations();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const [showDebug, setShowDebug] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Focus trap + Escape handler
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Focus the dialog on mount
    dialog.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialog!.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("failed");
      setTimeout(() => setCopyState("idle"), 1500);
    }
  }

  const CopyIcon =
    copyState === "copied" ? Check : copyState === "failed" ? AlertCircle : Copy;

  const confidencePercent = Math.round(item.confidence * 100);
  const confidenceColor =
    item.confidence >= 0.8 ? "var(--research)" :
      item.confidence >= 0.5 ? "var(--policy)" :
        item.confidence >= 0.3 ? "var(--warning)" : "var(--incidents)";

  const categoryColorVar: Record<string, string> = {
    policy: "var(--policy)",
    research: "var(--research)",
    industry: "var(--industry)",
    funding: "var(--funding)",
    news: "var(--news)",
    incidents: "var(--incidents)",
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="modal-panel max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-borderSoft bg-surface shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label={t("feed.details")}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-borderSoft px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold leading-snug">{item.title}</h2>
            <button
              className="btn-icon shrink-0"
              onClick={onClose}
              aria-label={t("feed.close")}
            >
              <X size={16} />
            </button>
          </div>
          {/* Inline metadata badges */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-caption">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ background: categoryColorVar[item.category] ?? "var(--surfaceInset)", color: "white" }}>
              {item.category}
            </span>
            <span className="badge badge-neutral">{item.publisher}</span>
            <span className="badge badge-neutral">{item.jurisdiction}</span>
            <span className="badge badge-neutral">{item.language.toUpperCase()}</span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Source Link */}
          <div>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-borderSoft px-3 py-2 text-sm font-medium hover:bg-surfaceInset transition-colors"
            >
              <ExternalLink size={14} />
              {t("feed.details")}
            </a>
            <button
              className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-borderSoft px-3 py-2 text-sm hover:bg-surfaceInset transition-colors"
              onClick={copyUrl}
            >
              <CopyIcon size={14} />
              {copyState === "copied"
                ? t("feed.copied")
                : copyState === "failed"
                  ? t("feed.copyFailed")
                  : t("feed.copyUrl")}
            </button>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Confidence */}
            <div className="rounded-lg bg-surfaceInset p-3">
              <p className="text-micro text-textMuted mb-1">{t("feed.confidence")}</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold" style={{ color: confidenceColor }}>{confidencePercent}%</span>
                <div className="flex-1 h-1.5 rounded-full bg-bg overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${confidencePercent}%`, background: confidenceColor }} />
                </div>
              </div>
            </div>

            {/* Published */}
            <div className="rounded-lg bg-surfaceInset p-3">
              <p className="text-micro text-textMuted mb-1">Published</p>
              <p className="text-sm font-medium">{item.published_at ? new Date(item.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</p>
            </div>

            {/* Entities */}
            <div className="rounded-lg bg-surfaceInset p-3">
              <p className="text-micro text-textMuted mb-1">{t("feed.entities")}</p>
              {item.entities.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {item.entities.map((e) => (
                    <span key={e} className="badge badge-neutral text-micro">{e}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-textMuted italic">-</p>
              )}
            </div>

            {/* Tags */}
            <div className="rounded-lg bg-surfaceInset p-3">
              <p className="text-micro text-textMuted mb-1">{t("feed.tags")}</p>
              {item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="badge badge-neutral text-micro">{tag}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-textMuted italic">-</p>
              )}
            </div>
          </div>

          {/* Debug toggle */}
          <button
            onClick={() => setShowDebug((prev) => !prev)}
            className="inline-flex items-center gap-1 text-caption text-textMuted hover:text-textSecondary"
          >
            {showDebug ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showDebug ? "Hide technical details" : "Show technical details"}
          </button>
          {showDebug && (
            <div className="space-y-1 rounded-lg bg-surfaceInset p-3 text-caption font-mono text-textMuted">
              <p><strong>source_id:</strong> {item.source_id}</p>
              <p><strong>source_type:</strong> {item.source_type}</p>
              <p><strong>hash:</strong> {item.hash}</p>
              <p><strong>ingested_at:</strong> {item.ingested_at}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
