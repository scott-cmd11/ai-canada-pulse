import { NextResponse } from "next/server"
import { fetchRegionalInterest } from "@/lib/trends-regional-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    const limited = await checkRateLimit(request, 'loose')
    if (limited) return limited
    try {
        const data = await fetchRegionalInterest()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/trends-regional] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch regional trends" }, { status: 502 })
    }
}
