import { NextResponse } from "next/server"
import { fetchRegionalInterest } from "@/lib/trends-regional-client"

export const dynamic = "force-static"
export const revalidate = 21600 // 6 hours

export async function GET() {
    try {
        const data = await fetchRegionalInterest()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/trends-regional] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch regional trends" }, { status: 502 })
    }
}
