import { NextResponse } from "next/server"
import { fetchMETRTimeHorizons } from "@/lib/epoch-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
    const limited = await checkRateLimit(request, 'loose')
    if (limited) return limited
    try {
        const result = await fetchMETRTimeHorizons()

        return NextResponse.json({
            models: result.models,
            stats: result.stats,
            fetchedAt: result.fetchedAt,
        })
    } catch (err) {
        console.warn("[api/epoch-models] Failed:", err)
        return NextResponse.json({ models: [], stats: null, fetchedAt: null })
    }
}
