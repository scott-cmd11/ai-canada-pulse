import { NextResponse } from "next/server"
import { fetchArxivData } from "@/lib/arxiv-client"

export const dynamic = "force-static"
export const revalidate = 21600 // 6 hours

export async function GET() {
    try {
        const data = await fetchArxivData()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/arxiv] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch arXiv data" }, { status: 502 })
    }
}
