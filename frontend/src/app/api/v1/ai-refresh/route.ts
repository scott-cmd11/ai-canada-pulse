import { NextRequest, NextResponse } from "next/server"
import { refreshDashboardEnrichmentBundle } from "@/lib/dashboard-enrichment"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function isAuthorized(request: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        return process.env.NODE_ENV !== "production"
    }

    const authHeader = request.headers.get("authorization")
    return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    try {
        const bundle = await refreshDashboardEnrichmentBundle()
        return NextResponse.json({
            ok: true,
            generatedAt: bundle.generatedAt,
            canadaSummaries: Object.keys(bundle.canada?.summaries ?? {}).length,
            canadaSummaryTarget: bundle.counts.canadaSummaryTarget,
            canadaVisibleStories: bundle.counts.canadaVisibleStories,
            canadaBriefCount: bundle.canada?.executiveBrief?.length ?? 0,
            globalSummaries: Object.keys(bundle.global?.summaries ?? {}).length,
            globalSummaryTarget: bundle.counts.globalSummaryTarget,
            globalVisibleStories: bundle.counts.globalVisibleStories,
            globalBriefCount: bundle.global?.executiveBrief?.length ?? 0,
        })
    } catch (err) {
        console.warn("[api/ai-refresh] Refresh failed:", err)
        return NextResponse.json({ ok: false, error: "Refresh failed" }, { status: 502 })
    }
}
