"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Globe, Filter } from "lucide-react";
import { DashboardShell } from "./dashboard/shell";
import { resourcesRegistry } from "../lib/resources-registry";
import { useTheme } from "./theme-provider";

interface ResourcesPageProps {
    locale: string;
    otherLocale: string;
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

    const filteredResources = resourcesRegistry.filter((r) => {
        const matchesCategory = activeCategory === "All" || r.category === activeCategory;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            r.title.toLowerCase().includes(searchLower) ||
            r.description.toLowerCase().includes(searchLower) ||
            r.url.toLowerCase().includes(searchLower);
        return matchesCategory && matchesSearch;
    });

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
            headerMeta={<h1 className="text-zinc-100 font-medium">AI Resources Hub</h1>}
        >
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-6 lg:p-8">

                {/* Header Section */}
                <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Globe size={20} />
                        </div>
                        <h1 className="text-2xl font-semibold text-zinc-100">{t("resources.title")}</h1>
                    </div>
                    <p className="mt-3 text-zinc-400 max-w-3xl leading-relaxed">
                        {t("resources.description")}
                    </p>
                </section>

                {/* Controls */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder={t("resources.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                        <Filter size={14} className="text-zinc-500 hidden sm:block" />
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex-none rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${activeCategory === cat
                                    ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                                    : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                                    }`}
                            >
                                {cat === "All" ? t("resources.categoryFilter") : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredResources.map((resource) => (
                        <a
                            key={resource.id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 transition-all hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-800/40 hover:shadow-lg hover:shadow-purple-500/5"
                        >
                            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="inline-flex items-center rounded-sm bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 border border-zinc-700/50">
                                        {resource.category}
                                    </span>
                                    <Globe size={14} className="text-zinc-600 transition-colors group-hover:text-zinc-400" />
                                </div>
                                <h3 className="text-base font-medium text-zinc-200 group-hover:text-purple-300 transition-colors line-clamp-2">
                                    {resource.title}
                                </h3>
                                <p className="mt-2 text-sm text-zinc-500 line-clamp-3 leading-relaxed">
                                    {resource.description}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400 opacity-80 group-hover:opacity-100 transition-opacity">
                                <span className="truncate">{new URL(resource.url).hostname.replace('www.', '')}</span>
                            </div>
                        </a>
                    ))}
                    {filteredResources.length === 0 && (
                        <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                            <p className="text-zinc-400">No resources found matching your criteria.</p>
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setActiveCategory("All");
                                }}
                                className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
