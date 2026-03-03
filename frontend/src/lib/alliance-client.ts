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

    // Overall status — derive from actual cluster statuses, not the page banner
    // (The page banner shows "experiencing an outage" for planned decommissions too)
    const outageCount = clusters.filter((c) => c.status === "outage").length
    const decomCount = clusters.filter((c) => c.status === "decommissioned").length
    const degradedCount = clusters.filter((c) => c.status === "degraded").length
    const maintenanceCount = clusters.filter((c) => c.status === "maintenance").length
    const operationalCount = clusters.filter((c) => c.status === "operational").length

    let overallStatus = "All Systems Operational"
    if (outageCount > 0) overallStatus = `${outageCount} System${outageCount > 1 ? "s" : ""} Down`
    else if (degradedCount > 0) overallStatus = `${operationalCount} Operational, ${degradedCount} Degraded`
    else if (maintenanceCount > 0) overallStatus = `${operationalCount} Operational, ${maintenanceCount} In Maintenance`
    else if (decomCount > 0) overallStatus = `${operationalCount} Active, ${decomCount} Retiring`

    // Clean up active incidents: remove French text and deduplicate similar notices
    const cleanedIncidents = activeIncidents
        // Remove French-language notices
        .filter((inc) => !/\b(est|avec|sont|qui|pas|encore|les|des|certains|prêts|une|sur|fin de)\b/i.test(inc))
        // Remove pure date-range notices like "2025-01-06 - 2025-09-30 - ..."
        .filter((inc) => !/^\d{4}-\d{2}-\d{2}\s*-\s*\d{4}/.test(inc))

    // Deduplicate similar notices (e.g. multiple "End of Service" variants)
    const deduped: string[] = []
    const seenKeys = new Set<string>()
    for (const inc of cleanedIncidents) {
        // Normalize to a dedup key: lowercase, strip dates and punctuation
        const key = inc.toLowerCase()
            .replace(/\d{4}[-/]\d{2}[-/]\d{2}/g, "")
            .replace(/[^a-z ]/g, "")
            .replace(/\s+/g, " ")
            .trim()
        // Collapse similar short phrases
        const shortKey = key.split(" ").slice(0, 3).join(" ")
        if (!seenKeys.has(shortKey)) {
            seenKeys.add(shortKey)
            deduped.push(inc)
        }
    }

    return {
        clusters,
        overallStatus,
        activeIncidents: deduped.slice(0, 5),
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
