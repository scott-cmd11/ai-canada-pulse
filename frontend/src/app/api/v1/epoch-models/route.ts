import { NextResponse } from "next/server"
import { fetchEpochModels } from "@/lib/epoch-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
    try {
        const result = await fetchEpochModels()

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
