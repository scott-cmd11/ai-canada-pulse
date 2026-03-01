"use client"

import { useState, useEffect } from "react"
import type { AllianceData, ComputeCluster } from "@/lib/alliance-client"

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
                <h2 className="section-header">National AI Compute (PAICE)</h2>
                {data && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${data.overallStatus.includes("Operational")
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-amber-700 bg-amber-50 border-amber-200"
                        }`}>
                        {data.overallStatus}
                    </span>
                )}
            </div>

            {loading && (
                <div className="saas-card p-8 text-center">
                    <div className="animate-pulse text-sm text-slate-500">Checking compute cluster status...</div>
                </div>
            )}

            {!loading && data && (
                <div className="saas-card p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            )}

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                Source: Digital Research Alliance of Canada · status.alliancecan.ca
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
        unknown: { dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-600", label: "Unknown" },
    }

    const cfg = statusConfig[cluster.status]

    return (
        <div className={`p-4 rounded-lg border border-slate-200 ${cfg.bg}`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-900">{cluster.name}</p>
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.text}`}>
                        {cfg.label}
                    </span>
                </div>
            </div>
            <p className="text-xs text-slate-500">{cluster.location}</p>
        </div>
    )
}
