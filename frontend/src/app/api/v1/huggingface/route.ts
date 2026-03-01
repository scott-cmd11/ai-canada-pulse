import { NextResponse } from "next/server"
import { fetchHuggingFaceData } from "@/lib/huggingface-client"

export const dynamic = "force-static"
export const revalidate = 1800 // 30 min

export async function GET() {
    try {
        const data = await fetchHuggingFaceData()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/huggingface] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch HuggingFace data" }, { status: 502 })
    }
}
