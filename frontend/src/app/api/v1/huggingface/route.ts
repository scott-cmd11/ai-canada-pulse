import { NextResponse } from "next/server"
import { fetchHuggingFaceData } from "@/lib/huggingface-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    const limited = await checkRateLimit(request, 'loose')
    if (limited) return limited
    try {
        const data = await fetchHuggingFaceData()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/huggingface] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch HuggingFace data" }, { status: 502 })
    }
}
