import { NextResponse } from "next/server"
import { fetchGitHubData } from "@/lib/github-client"

export const dynamic = "force-static"
export const revalidate = 1800 // 30 min

export async function GET() {
    try {
        const data = await fetchGitHubData()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/github] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch GitHub data" }, { status: 502 })
    }
}
