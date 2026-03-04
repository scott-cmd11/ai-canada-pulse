import { NextResponse } from "next/server"
import { fetchGlobalAIInterest } from "@/lib/global-client"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const data = await fetchGlobalAIInterest()
        return NextResponse.json(
            { data },
            { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=43200" } }
        )
    } catch (err) {
        console.warn("[api/global-trends] Failed:", err)
        return NextResponse.json({ data: [] })
    }
}
