import { NextResponse } from "next/server"
import { fetchAllianceStatus } from "@/lib/alliance-client"

export const dynamic = "force-static"
export const revalidate = 300 // 5 min

export async function GET() {
    try {
        const data = await fetchAllianceStatus()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/compute-status] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch compute status" }, { status: 502 })
    }
}
