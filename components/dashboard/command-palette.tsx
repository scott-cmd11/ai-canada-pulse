"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
    Search,
    Moon,
    Sun,
    Landmark,
    BarChart3,
    Filter,
    Download,
    Zap,
    Eye,
    EyeOff,
} from "lucide-react";

interface CommandPaletteAction {
    id: string;
    label: string;
    hint?: string;
    icon: React.ReactNode;
    group: "navigate" | "filter" | "action";
    onSelect: () => void;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    /** Current scope for toggling */
    scope: "canada" | "world";
    /** Theme toggle */
    theme: "light" | "dark";
    onToggleTheme: () => void;
    /** Filter actions */
    onSetCategory: (cat: string) => void;
    onSetTimeWindow: (tw: string) => void;
    /** Navigation */
    locale: string;
    /** Mode toggle */
    mode: string;
    onToggleMode: () => void;
    /** Export */
    onExportCsv?: () => void;
    /** Analysis toggle */
    analysisExpanded: boolean;
    onToggleAnalysis: () => void;
}

const CATEGORIES = [
    "Policy & Regulation",
    "Industry & Economy",
    "Research & Innovation",
    "Ethics & Society",
    "Infrastructure & Compute",
    "Security & Defence",
    "Talent & Education",
    "International",
];

const TIME_WINDOWS = ["1h", "24h", "7d", "15d", "30d", "90d"];

export function CommandPalette({
    isOpen,
    onClose,
    scope,
    theme,
    onToggleTheme,
    onSetCategory,
    onSetTimeWindow,
    locale,
    mode,
    onToggleMode,
    onExportCsv,
    analysisExpanded,
    onToggleAnalysis,
}: CommandPaletteProps) {
    const t = useTranslations();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Build all available actions
    const actions: CommandPaletteAction[] = useMemo(() => {
        const items: CommandPaletteAction[] = [];

        // Navigation
        items.push({
            id: "nav-canada",
            label: "Go to Canada Dashboard",
            hint: `/${locale}/canada`,
            icon: <Landmark size={14} />,
            group: "navigate",
            onSelect: () => {
                window.location.href = `/${locale}/canada`;
            },
        });
        items.push({
            id: "nav-methods",
            label: "Go to Methods",
            hint: `/${locale}/methods`,
            icon: <BarChart3 size={14} />,
            group: "navigate",
            onSelect: () => {
                window.location.href = `/${locale}/methods`;
            },
        });

        // Category filters
        for (const cat of CATEGORIES) {
            items.push({
                id: `filter-cat-${cat}`,
                label: `Filter: ${cat}`,
                hint: "category",
                icon: <Filter size={14} />,
                group: "filter",
                onSelect: () => onSetCategory(cat),
            });
        }

        // Time window filters
        for (const tw of TIME_WINDOWS) {
            items.push({
                id: `filter-tw-${tw}`,
                label: `Time: ${tw.toUpperCase()}`,
                hint: "window",
                icon: <Zap size={14} />,
                group: "filter",
                onSelect: () => onSetTimeWindow(tw),
            });
        }

        // Actions
        items.push({
            id: "action-theme",
            label: theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode",
            hint: "theme",
            icon: theme === "light" ? <Moon size={14} /> : <Sun size={14} />,
            group: "action",
            onSelect: onToggleTheme,
        });

        items.push({
            id: "action-mode",
            label: mode === "policy" ? "Switch to Research Mode" : "Switch to Policy Mode",
            hint: "mode",
            icon: <Search size={14} />,
            group: "action",
            onSelect: onToggleMode,
        });

        items.push({
            id: "action-analysis",
            label: analysisExpanded ? "Hide Analysis Panels" : "Show Analysis Panels",
            hint: "toggle",
            icon: analysisExpanded ? <EyeOff size={14} /> : <Eye size={14} />,
            group: "action",
            onSelect: onToggleAnalysis,
        });

        if (onExportCsv) {
            items.push({
                id: "action-export",
                label: "Export Feed as CSV",
                hint: "export",
                icon: <Download size={14} />,
                group: "action",
                onSelect: onExportCsv,
            });
        }

        return items;
    }, [locale, theme, mode, analysisExpanded, onToggleTheme, onSetCategory, onSetTimeWindow, onToggleMode, onToggleAnalysis, onExportCsv]);

    // Filter by query
    const filtered = useMemo(() => {
        if (!query.trim()) return actions;
        const q = query.toLowerCase();
        return actions.filter(
            (a) =>
                a.label.toLowerCase().includes(q) ||
                (a.hint && a.hint.toLowerCase().includes(q)) ||
                a.group.toLowerCase().includes(q)
        );
    }, [actions, query]);

    // Reset selection when query or open state changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Global ⌘K / Ctrl+K listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                if (isOpen) {
                    onClose();
                } else {
                    // We need the parent to open us — this is just for closing
                }
            }
            if (e.key === "Escape" && isOpen) {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && filtered[selectedIndex]) {
                e.preventDefault();
                filtered[selectedIndex].onSelect();
                onClose();
            }
        },
        [filtered, selectedIndex, onClose]
    );

    if (!isOpen) return null;

    // Group results
    const grouped = {
        navigate: filtered.filter((a) => a.group === "navigate"),
        filter: filtered.filter((a) => a.group === "filter"),
        action: filtered.filter((a) => a.group === "action"),
    };

    let runningIndex = 0;

    return (
        <div
            className="dd-cmd-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
        >
            <div className="dd-cmd-panel" onKeyDown={handleKeyDown}>
                <input
                    ref={inputRef}
                    className="dd-cmd-input"
                    placeholder={t("commandPalette.placeholder")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Command search"
                    autoComplete="off"
                />
                <div className="dd-cmd-results">
                    {filtered.length === 0 ? (
                        <div className="dd-quiet-period">
                            <p>{t("commandPalette.noResults")}</p>
                        </div>
                    ) : (
                        <>
                            {(["navigate", "filter", "action"] as const).map((group) => {
                                const items = grouped[group];
                                if (items.length === 0) return null;
                                return (
                                    <div key={group}>
                                        <div className="px-3 pt-2 pb-1 text-micro text-textMuted uppercase tracking-wider font-semibold">
                                            {t(`commandPalette.${group}`)}
                                        </div>
                                        {items.map((item) => {
                                            const idx = runningIndex++;
                                            return (
                                                <button
                                                    key={item.id}
                                                    className={`dd-cmd-item ${idx === selectedIndex ? "is-selected" : ""}`}
                                                    onClick={() => {
                                                        item.onSelect();
                                                        onClose();
                                                    }}
                                                    onMouseEnter={() => setSelectedIndex(idx)}
                                                >
                                                    {item.icon}
                                                    <span className="dd-cmd-item-label">{item.label}</span>
                                                    {item.hint && (
                                                        <span className="dd-cmd-item-hint">{item.hint}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
