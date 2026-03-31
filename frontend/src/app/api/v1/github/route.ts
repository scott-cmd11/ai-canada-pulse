import { NextResponse } from "next/server"
import { fetchGitHubData } from "@/lib/github-client"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
    const limited = await checkRateLimit(request, 'standard')
    if (limited) return limited

    try {
        const data = await fetchGitHubData()
        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/github] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch GitHub data" }, { status: 502 })
    }
}
