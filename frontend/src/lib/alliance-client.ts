/**
 * Digital Research Alliance of Canada — Compute Status Client
 * Parses the live HTML status page at status.alliancecan.ca
 * to extract real-time cluster operational status and incidents.
 */

const TIMEOUT_MS = 10_000
const STATUS_URL = "https://status.alliancecan.ca/"

// HPC compute clusters we care about (excludes cloud, storage, and support services)
const HPC_CLUSTERS = [
    { name: "Narval", location: "Calcul Québec, Montreal" },
    { name: "Béluga", location: "Calcul Québec, Montreal" },
    { name: "Cedar", location: "WestGrid, Vancouver" },
    { name: "Graham", location: "SHARCNET, Waterloo" },
    { name: "Niagara", location: "SciNet, Toronto" },
    { name: "Arbutus", location: "UVic, Victoria" },
    { name: "Nibi", location: "Calcul Québec" },
    { name: "Rorqual", location: "Calcul Québec" },
    { name: "Trillium", location: "SciNet, Toronto" },
    { name: "Fir", location: "WestGrid, Vancouver" },
    { name: "Juno", location: "SciNet, Toronto" },
    { name: "Killarney", location: "ACENET" },
    { name: "Lunaris", location: "DRAC" },
    { name: "Vulcan", location: "WestGrid" },
]

export interface ComputeCluster {
    name: string
    status: "operational" | "degraded" | "outage" | "maintenance" | "decommissioned" | "unknown"
    location: string
    incident?: string
}

export interface AllianceData {
    clusters: ComputeCluster[]
    overallStatus: string
    activeIncidents: string[]
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
            console.warn(`[alliance-client] Status page returned ${res.status}`)
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

    // Extract active incidents from the HTML
    const activeIncidents: string[] = []
    const incidentRegex = /view_incident\?incident=\d+[^>]*>([^<]+)</g
    let incidentMatch
    while ((incidentMatch = incidentRegex.exec(html)) !== null) {
        const title = incidentMatch[1].trim()
        if (title && !activeIncidents.includes(title)) {
            activeIncidents.push(title)
        }
    }

    for (const cluster of HPC_CLUSTERS) {
        let status: ComputeCluster["status"] = "unknown"
        let incident: string | undefined

        // Find incident text near system name
        const clusterIncident = activeIncidents.find((inc) => {
            // Find if there's an incident associated with this cluster
            const escapedName = cluster.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            const nearbyPattern = new RegExp(
                `${escapedName}[\\s\\S]{0,300}?view_incident[^>]*>([^<]+)`,
                "i"
            )
            const match = html.match(nearbyPattern)
            return match && inc === match[1].trim()
        })

        if (clusterIncident) {
            incident = clusterIncident
            const lower = clusterIncident.toLowerCase()
            if (lower.includes("decommission") || lower.includes("end of service") || lower.includes("fin de service")) {
                status = "decommissioned"
            } else if (lower.includes("outage") || lower.includes("arrêt")) {
                status = "maintenance"
            } else if (lower.includes("degraded") || lower.includes("missing") || lower.includes("partial")) {
                status = "degraded"
            } else {
                status = "degraded"
            }
        } else {
            // Check if system name appears with no linked incident → likely operational
            if (html.includes(`>${cluster.name}<`)) {
                status = "operational"
            }
        }

        clusters.push({ name: cluster.name, status, location: cluster.location, incident })
    }

    // Overall status
    const hasOutage = html.toLowerCase().includes("experiencing an outage")
    const decomCount = clusters.filter((c) => c.status === "decommissioned").length
    const degradedCount = clusters.filter((c) => c.status === "degraded").length
    const operationalCount = clusters.filter((c) => c.status === "operational").length

    let overallStatus = "All Systems Operational"
    if (hasOutage) overallStatus = "Service Outage Detected"
    else if (degradedCount > 0) overallStatus = `${operationalCount} Operational, ${degradedCount} Degraded`
    else if (decomCount > 0) overallStatus = `${operationalCount} Operational, ${decomCount} Decommissioning`

    return {
        clusters,
        overallStatus,
        activeIncidents: activeIncidents.slice(0, 5),
        fetchedAt: new Date().toISOString(),
        isLive: true,
    }
}

function getFallbackStatus(): AllianceData {
    return {
        clusters: HPC_CLUSTERS.map((c) => ({ ...c, status: "unknown" as const })),
        overallStatus: "Status page unreachable",
        activeIncidents: [],
        fetchedAt: new Date().toISOString(),
        isLive: false,
    }
}
