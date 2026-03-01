/**
 * Digital Research Alliance of Canada — Compute Status Client
 * Monitors PAICE HPC cluster uptime and incidents.
 */

const TIMEOUT_MS = 10_000
const STATUS_URL = "https://status.alliancecan.ca/"

export interface ComputeCluster {
    name: string
    status: "operational" | "degraded" | "outage" | "maintenance" | "unknown"
    location: string
}

export interface AllianceData {
    clusters: ComputeCluster[]
    overallStatus: string
    activeIncidents: number
    fetchedAt: string
    isLive: boolean
}

export async function fetchAllianceStatus(): Promise<AllianceData> {
    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const res = await fetch(STATUS_URL, {
            headers: { "User-Agent": "AICanadaPulse/1.0", Accept: "text/html" },
            signal: controller.signal,
        })
        clearTimeout(timer)

        if (!res.ok) {
            return getFallbackStatus()
        }

        const html = await res.text()
        return parseStatusPage(html)
    } catch (err) {
        console.warn("[alliance-client] Status fetch failed:", err)
        return getFallbackStatus()
    }
}

function parseStatusPage(html: string): AllianceData {
    const clusters: ComputeCluster[] = []

    // Known PAICE/Alliance clusters
    const knownClusters = [
        { name: "Narval", location: "Montreal, QC" },
        { name: "Béluga", location: "Montreal, QC" },
        { name: "Cedar", location: "Vancouver, BC" },
        { name: "Graham", location: "Waterloo, ON" },
        { name: "Niagara", location: "Toronto, ON" },
    ]

    for (const cluster of knownClusters) {
        // Try to find status indicators in the HTML
        const statusRegex = new RegExp(
            `${cluster.name}[\\s\\S]{0,500}?(operational|degraded|major|partial|maintenance)`,
            "i"
        )
        const match = html.match(statusRegex)
        let status: ComputeCluster["status"] = "unknown"

        if (match) {
            const raw = match[1].toLowerCase()
            if (raw.includes("operation")) status = "operational"
            else if (raw.includes("degrad") || raw.includes("partial")) status = "degraded"
            else if (raw.includes("major")) status = "outage"
            else if (raw.includes("maintenance")) status = "maintenance"
        } else if (html.includes(cluster.name)) {
            // If the cluster is mentioned but no status keyword found, assume operational
            status = "operational"
        }

        clusters.push({ name: cluster.name, status, location: cluster.location })
    }

    // Count incidents
    const incidentMatches = html.match(/incident/gi) || []
    const activeIncidents = Math.min(incidentMatches.length, 5) // cap to avoid noise

    const allOperational = clusters.every((c) => c.status === "operational")
    const hasOutage = clusters.some((c) => c.status === "outage")

    return {
        clusters,
        overallStatus: hasOutage ? "Partial Outage" : allOperational ? "All Systems Operational" : "Some Degradation",
        activeIncidents: activeIncidents > 2 ? 0 : activeIncidents, // filter noise
        fetchedAt: new Date().toISOString(),
        isLive: true,
    }
}

function getFallbackStatus(): AllianceData {
    return {
        clusters: [
            { name: "Narval", status: "operational", location: "Montreal, QC" },
            { name: "Béluga", status: "operational", location: "Montreal, QC" },
            { name: "Cedar", status: "operational", location: "Vancouver, BC" },
            { name: "Graham", status: "operational", location: "Waterloo, ON" },
            { name: "Niagara", status: "operational", location: "Toronto, ON" },
        ],
        overallStatus: "Status page unreachable — assuming operational",
        activeIncidents: 0,
        fetchedAt: new Date().toISOString(),
        isLive: false,
    }
}
