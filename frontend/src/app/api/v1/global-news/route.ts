import { NextResponse } from "next/server"
import { fetchGlobalAINews } from "@/lib/global-client"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const stories = await fetchGlobalAINews()
        return NextResponse.json(
            { stories },
            { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
        )
    } catch (err) {
        console.warn("[api/global-news] Failed:", err)
        return NextResponse.json({ stories: [] })
    }
}
