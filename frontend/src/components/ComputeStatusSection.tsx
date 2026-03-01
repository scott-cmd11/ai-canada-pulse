"use client"

import { useState, useEffect } from "react"
import type { AllianceData, ComputeCluster } from "@/lib/alliance-client"

/** Strip French portion from bilingual incident titles (format: "English - Français") */
function stripFrench(text: string): string {
    // Remove " - French text" patterns (the Alliance uses " - " as separator)
    return text
        .replace(/\s*-\s*Fermeture\s*:.*/i, "")
        .replace(/\s*-\s*Fin de service.*/i, "")
        .replace(/\s*-\s*Arrêt\s.*/i, "")
        .replace(/\s*-\s*L'Assistant\s.*/i, "")
        .replace(/\s*-\s*calendrier\s.*/i, "")
        .replace(/\s*-\s*Environnement\s.*/i, "")
        .replace(/\s*-\s*Centre d'assistance.*/i, "")
        .replace(/\s*-\s*Rorqual est en ligne.*/i, "")
        .replace(/\s*-\s*Planned Decommissioning\s*-\s*Arrêt complet planifié/i, " - Planned Decommissioning")
        .replace(/\s*,\s*\d+ [a-zéèêë]+ \d{4}$/i, "") // Strip French date at end like ", 12 septembre 2025"
        .trim()
}

export default function ComputeStatusSection() {
    const [data, setData] = useState<AllianceData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/v1/compute-status")
            .then((r) => r.json())
            .then((json) => { if (json.data) setData(json.data) })
            .finally(() => setLoading(false))
    }, [])

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="section-header">National AI Compute Infrastructure</h2>
                {data && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${data.overallStatus.includes("Outage")
                            ? "text-red-700 bg-red-50 border-red-200"
                            : data.overallStatus.includes("Degraded") || data.overallStatus.includes("Decommissioning")
                                ? "text-amber-700 bg-amber-50 border-amber-200"
                                : "text-emerald-700 bg-emerald-50 border-emerald-200"
                        }`}>
                        {data.overallStatus}
                    </span>
                )}
            </div>

            <p className="text-sm text-slate-600 mb-4 max-w-3xl leading-relaxed">
                Live operational status of the Digital Research Alliance of Canada&apos;s high-performance computing (HPC) clusters.
                These systems power Canada&apos;s national AI research infrastructure under the Pan-Canadian AI Compute Environment (PAICE),
                providing GPU and CPU resources to researchers across the country.
            </p>

            {loading && (
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm text-slate-500">Checking compute cluster status...</div>
                </div>
            )}

            {!loading && data && (
                <>
                    <div className="saas-card p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.clusters.map((cluster) => (
                                <ClusterCard key={cluster.name} cluster={cluster} />
                            ))}
                        </div>

                        {!data.isLive && (
                            <p className="text-[10px] text-amber-600 mt-3 italic">
                                Status page unreachable — showing last known state
                            </p>
                        )}
                    </div>

                    {/* Active incidents */}
                    {data.activeIncidents.length > 0 && (
                        <div className="saas-card p-4 mt-3 border-l-4 border-l-amber-400">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Active Notices
                            </p>
                            <ul className="flex flex-col gap-1.5">
                                {data.activeIncidents.map((inc, i) => (
                                    <li key={i} className="text-xs text-slate-600 leading-relaxed">
                                        • {stripFrench(inc)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                Source: Digital Research Alliance of Canada · status.alliancecan.ca · {data?.isLive ? "Live" : "Fallback"}
            </p>
        </section>
    )
}

function ClusterCard({ cluster }: { cluster: ComputeCluster }) {
    const statusConfig = {
        operational: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Operational" },
        degraded: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", label: "Degraded" },
        outage: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", label: "Outage" },
        maintenance: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", label: "Maintenance" },
        decommissioned: { dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-500", label: "Retiring" },
        unknown: { dot: "bg-slate-300", bg: "bg-slate-50", text: "text-slate-500", label: "Unknown" },
    }

    const cfg = statusConfig[cluster.status]
    const cleanIncident = cluster.incident ? stripFrench(cluster.incident) : ""

    return (
        <div
            className={`p-4 rounded-lg border border-slate-200 ${cfg.bg}`}
            title={cleanIncident}
        >
            <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-slate-900">{cluster.name}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.text}`}>
                        {cfg.label}
                    </span>
                </div>
            </div>
            <p className="text-xs text-slate-500">{cluster.location}</p>
            {cleanIncident && (
                <p className="text-[10px] text-amber-600 mt-2 leading-relaxed">
                    ⚠ {cleanIncident}
                </p>
            )}
        </div>
    )
}
