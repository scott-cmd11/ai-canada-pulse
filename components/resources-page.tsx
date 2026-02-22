"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, Globe, Filter, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { DashboardShell } from "./dashboard/shell";
import { resourcesRegistry } from "../lib/resources-registry";
import { useTheme } from "./theme-provider";

interface ResourcesPageProps {
    locale: string;
    otherLocale: string;
}

/* ── Category styling map ── */
const CATEGORY_STYLES: Record<string, { color: string; icon: string }> = {
    "Evaluation & Benchmarks": { color: "var(--status-warning)", icon: "📊" },
    "Government & Policy": { color: "var(--policy)", icon: "🏛️" },
    "Media & Newsletters": { color: "var(--news)", icon: "📰" },
    "Models & Repositories": { color: "var(--industry)", icon: "🤖" },
    "Research & Institutes": { color: "var(--research)", icon: "🔬" },
};

function getCategoryStyle(cat: string) {
    return CATEGORY_STYLES[cat] ?? { color: "var(--text-muted)", icon: "📁" };
}

export function ResourcesPage({
    locale,
    otherLocale,
}: ResourcesPageProps) {
    const t = useTranslations();
    const { theme, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const categories = ["All", ...Array.from(new Set(resourcesRegistry.map((r) => r.category))).sort()];

    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
        new Set(categories.filter((c) => c !== "All"))
    );

    const filteredResources = useMemo(() => {
        return resourcesRegistry.filter((r) => {
            const matchesCategory = activeCategory === "All" || r.category === activeCategory;
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                r.title.toLowerCase().includes(searchLower) ||
                r.description.toLowerCase().includes(searchLower) ||
                r.url.toLowerCase().includes(searchLower);
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    /* Group filtered resources by category */
    const groupedResources = useMemo(() => {
        const groups = new Map<string, typeof filteredResources>();
        for (const r of filteredResources) {
            const list = groups.get(r.category) ?? [];
            list.push(r);
            groups.set(r.category, list);
        }
        /* Sort groups alphabetically */
        return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
    }, [filteredResources]);

    const toggleSection = (cat: string) => {
        setCollapsedSections((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const isSearching = searchQuery.length > 0;

    return (
        <DashboardShell
            locale={locale}
            activeScope="resources"
            navLabels={{
                canada: t("nav.canada"),
                world: t("nav.world"),
                methods: t("nav.methods"),
                resources: t("nav.resources"),
            }}
            otherLocale={otherLocale}
            theme={theme}
            onToggleTheme={toggleTheme}
            headerMeta={<h1 className="font-medium" style={{ color: "var(--text-primary)" }}>AI Resources Hub</h1>}
        >
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-6 lg:p-8">

                {/* Header Section */}
                <section
                    className="mb-8 rounded-2xl p-6 backdrop-blur-md"
                    style={{
                        background: "var(--surface)",
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: "var(--border-soft)",
                        boxShadow: "var(--shadow-sm)",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{
                                background: "var(--primary-subtle)",
                                color: "var(--primary-action)",
                                border: "1px solid color-mix(in oklab, var(--primary-action) 20%, transparent)",
                            }}
                        >
                            <Globe size={20} />
                        </div>
                        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
                            {t("resources.title")}
                        </h1>
                    </div>
                    <p className="mt-3 max-w-3xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {t("resources.description")}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        <span>{filteredResources.length} resources</span>
                        <span>·</span>
                        <span>{groupedResources.size} categories</span>
                    </div>
                </section>

                {/* Controls */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--text-muted)" }} />
                        <input
                            type="text"
                            placeholder={t("resources.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg py-2 pl-9 pr-4 text-sm transition-all focus:outline-none focus:ring-1"
                            style={{
                                background: "var(--surface-inset)",
                                border: "1px solid var(--border-soft)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                        <Filter size={14} className="hidden sm:block" style={{ color: "var(--text-muted)" }} />
                        {categories.map((cat) => {
                            const isActive = activeCategory === cat;
                            const style = cat !== "All" ? getCategoryStyle(cat) : null;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className="flex-none rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                                    style={
                                        isActive
                                            ? {
                                                background: style ? `color-mix(in oklab, ${style.color} 15%, transparent)` : "var(--primary-subtle)",
                                                color: style ? style.color : "var(--primary-action)",
                                                border: `1px solid ${style ? `color-mix(in oklab, ${style.color} 30%, transparent)` : "color-mix(in oklab, var(--primary-action) 30%, transparent)"}`,
                                            }
                                            : {
                                                background: "var(--surface)",
                                                color: "var(--text-secondary)",
                                                border: "1px solid var(--border-soft)",
                                            }
                                    }
                                >
                                    {cat === "All" ? t("resources.categoryFilter") : cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Grouped Sections */}
                {filteredResources.length === 0 ? (
                    <div
                        className="col-span-full py-12 text-center rounded-xl"
                        style={{
                            border: "1px dashed var(--border-soft)",
                            background: "var(--surface-inset)",
                        }}
                    >
                        <p style={{ color: "var(--text-secondary)" }}>No resources found matching your criteria.</p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setActiveCategory("All");
                            }}
                            className="mt-4 text-sm transition-colors"
                            style={{ color: "var(--primary-action)" }}
                        >
                            Clear filters
                        </button>
                    </div>
                ) : isSearching ? (
                    /* Flat grid when searching */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredResources.map((resource) => (
                            <ResourceCard key={resource.id} resource={resource} />
                        ))}
                    </div>
                ) : (
                    /* Grouped by category */
                    <div className="space-y-6">
                        {[...groupedResources.entries()].map(([category, resources]) => {
                            const isCollapsed = collapsedSections.has(category);
                            const style = getCategoryStyle(category);
                            return (
                                <section key={category}>
                                    <button
                                        onClick={() => toggleSection(category)}
                                        className="mb-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all"
                                        style={{
                                            background: `color-mix(in oklab, ${style.color} 6%, var(--surface))`,
                                            border: `1px solid color-mix(in oklab, ${style.color} 15%, transparent)`,
                                        }}
                                    >
                                        <span className="text-base">{style.icon}</span>
                                        {isCollapsed ? (
                                            <ChevronRight size={16} style={{ color: style.color }} />
                                        ) : (
                                            <ChevronDown size={16} style={{ color: style.color }} />
                                        )}
                                        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                            {category}
                                        </span>
                                        <span
                                            className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium"
                                            style={{
                                                background: `color-mix(in oklab, ${style.color} 12%, transparent)`,
                                                color: style.color,
                                            }}
                                        >
                                            {resources.length}
                                        </span>
                                    </button>
                                    {!isCollapsed && (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 pl-2">
                                            {resources.map((resource) => (
                                                <ResourceCard key={resource.id} resource={resource} />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}

/* ── Resource Card ── */
function ResourceCard({ resource }: { resource: (typeof resourcesRegistry)[number] }) {
    const style = getCategoryStyle(resource.category);
    return (
        <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl p-5 transition-all hover:-translate-y-0.5"
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border-soft)",
                boxShadow: "var(--shadow-xs)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `color-mix(in oklab, ${style.color} 40%, var(--border-strong))`;
                e.currentTarget.style.boxShadow = `0 8px 20px -8px color-mix(in oklab, ${style.color} 15%, transparent)`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-soft)";
                e.currentTarget.style.boxShadow = "var(--shadow-xs)";
            }}
        >
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <span
                        className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                        style={{
                            background: `color-mix(in oklab, ${style.color} 10%, transparent)`,
                            color: style.color,
                            border: `1px solid color-mix(in oklab, ${style.color} 20%, transparent)`,
                        }}
                    >
                        {resource.category}
                    </span>
                    <ExternalLink size={14} className="opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--text-muted)" }} />
                </div>
                <h3
                    className="text-sm font-medium line-clamp-2 transition-colors"
                    style={{ color: "var(--text-primary)" }}
                >
                    {resource.title}
                </h3>
                {resource.description && (
                    <p className="mt-2 text-xs line-clamp-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {resource.description}
                    </p>
                )}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs opacity-80 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
                <span className="truncate">{(() => { try { return new URL(resource.url).hostname.replace('www.', ''); } catch { return resource.url; } })()}</span>
            </div>
        </a>
    );
}


