import { NextResponse } from "next/server"
import { fetchOecdData } from "@/lib/oecd-client"

export const dynamic = "force-static"
export const revalidate = 86400 // 24 hours

export async function GET() {
    try {
        const data = await fetchOecdData()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/oecd] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch OECD data" }, { status: 502 })
    }
}
