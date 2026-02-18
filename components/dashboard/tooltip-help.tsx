"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { getDefinition, type GlossaryKey } from "../../lib/glossary";

interface TooltipHelpProps {
  term: GlossaryKey;
}

export function TooltipHelp({ term }: TooltipHelpProps) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const definition = getDefinition(term, locale);
  if (!definition) return null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="ml-1 inline-flex items-center text-textMuted hover:text-textSecondary"
        aria-label={`Help: ${term}`}
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <div className="animate-scale-in absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded bg-surface p-2.5 border border-borderSoft text-caption text-textSecondary shadow-md">
          <p>{definition}</p>
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-surface" />
        </div>
      )}
    </div>
  );
}
