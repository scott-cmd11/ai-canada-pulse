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

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="modal-panel max-h-[90vh] w-full max-w-2xl overflow-auto rounded-md border border-borderSoft bg-surface p-5 shadow-md"
        role="dialog"
        aria-modal="true"
        aria-label={t("feed.details")}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary"
              onClick={copyUrl}
            >
              <CopyIcon size={14} />
              {copyState === "copied"
                ? t("feed.copied")
                : copyState === "failed"
                  ? t("feed.copyFailed")
                  : t("feed.copyUrl")}
            </button>
            <button
              className="btn-icon"
              onClick={onClose}
              aria-label={t("feed.close")}
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="space-y-2 text-body">
          <p>
            <strong>URL:</strong>{" "}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1"
            >
              {item.url}
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </p>
          <p>
            <strong>{t("feed.publisher")}:</strong> {item.publisher}
          </p>
          <p>
            <strong>{t("feed.jurisdiction")}:</strong> {item.jurisdiction}
          </p>
          <p>
            <strong>{t("feed.language")}:</strong> {item.language}
          </p>
          <p>
            <strong>{t("feed.confidence")}:</strong>{" "}
            {item.confidence.toFixed(2)}
          </p>
          <p>
            <strong>{t("feed.entities")}:</strong>{" "}
            {item.entities.join(", ") || "-"}
          </p>
          <p>
            <strong>{t("feed.tags")}:</strong> {item.tags.join(", ") || "-"}
          </p>
          <p>
            <strong>published_at:</strong> {item.published_at}
          </p>
          <p>
            <strong>ingested_at:</strong> {item.ingested_at}
          </p>

          {/* Debug toggle */}
          <button
            onClick={() => setShowDebug((prev) => !prev)}
            className="mt-2 inline-flex items-center gap-1 text-caption text-textMuted hover:text-textSecondary"
          >
            {showDebug ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showDebug ? "Hide debug info" : "Show debug info"}
          </button>
          {showDebug && (
            <div className="space-y-1 rounded-lg bg-surfaceInset p-3 text-caption font-mono text-textMuted">
              <p>
                <strong>source_id:</strong> {item.source_id}
              </p>
              <p>
                <strong>source_type:</strong> {item.source_type}
              </p>
              <p>
                <strong>hash:</strong> {item.hash}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
