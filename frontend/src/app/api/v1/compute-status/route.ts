import { NextResponse } from "next/server"
import { fetchAllianceStatus } from "@/lib/alliance-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    const limited = await checkRateLimit(request, 'loose')
    if (limited) return limited
    try {
        const data = await fetchAllianceStatus()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/compute-status] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch compute status" }, { status: 502 })
    }
}
