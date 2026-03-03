import { NextResponse } from "next/server"
import { fetchArxivData } from "@/lib/arxiv-client"
import { summarizeArxivPapers } from "@/lib/summarizer"

export const dynamic = "force-dynamic"
export const revalidate = 21600 // 6 hours

export async function GET() {
    try {
        const data = await fetchArxivData()

        // Generate AI summaries for the papers
        if (data.papers.length > 0) {
            const summaryMap = await summarizeArxivPapers(
                data.papers.map(p => ({ title: p.title, summary: p.summary }))
            )
            if (summaryMap) {
                data.papers = data.papers.map(p => ({
                    ...p,
                    aiSummary: summaryMap.get(p.title) || undefined,
                }))
            }
        }

        return NextResponse.json({ data })
    } catch (err) {
        console.error("[api/arxiv] Error:", err)
        return NextResponse.json({ data: null, error: "Failed to fetch arXiv data" }, { status: 502 })
    }
}
