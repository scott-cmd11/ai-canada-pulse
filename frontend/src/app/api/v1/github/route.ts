import { NextResponse } from "next/server"
import { fetchGitHubData } from "@/lib/github-client"
import { summarizeGitHubRepos } from "@/lib/summarizer"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
    try {
        const data = await fetchGitHubData()

        // AI-enrich: generate summaries for top repos
        let summaryMap: Map<string, string> | null = null
        try {
            summaryMap = await summarizeGitHubRepos(data.topRepos)
        } catch (err) {
            console.warn("[api/github] AI summarization failed:", err)
        }

        // Attach AI summaries to repos
        const enrichedRepos = data.topRepos.map((repo) => ({
            ...repo,
            aiSummary: summaryMap?.get(repo.fullName) ?? null,
        }))

        const attached = enrichedRepos.filter((r) => r.aiSummary).length
        console.log(`[api/github] AI summaries: ${attached}/${enrichedRepos.length} repos enriched`)

        return NextResponse.json({
            data: {
                ...data,
                topRepos: enrichedRepos,
            },
        })
    } catch (err) {
        console.error("[api/github] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch GitHub data" }, { status: 502 })
    }
}
