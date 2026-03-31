import { NextResponse } from "next/server"
import { fetchOecdData } from "@/lib/oecd-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    const limited = await checkRateLimit(request, 'loose')
    if (limited) return limited
    try {
        const data = await fetchOecdData()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/oecd] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch OECD data" }, { status: 502 })
    }
}
