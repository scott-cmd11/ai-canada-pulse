import { NextResponse } from "next/server"
import { fetchAllStories } from "@/lib/rss-client"

// Derive sentiment analysis from our already-working RSS story feed
// instead of relying on the frequently-unavailable GDELT API.

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const stories = await fetchAllStories()

    if (!stories || stories.length === 0) {
      return NextResponse.json({ data: null })
    }

    // Count sentiment from stories (already classified in rss-client.ts)
    const counts = { positive: 0, neutral: 0, negative: 0 }
    for (const s of stories) {
      if (s.sentiment === "positive") counts.positive++
      else if (s.sentiment === "concerning") counts.negative++
      else counts.neutral++
    }

    const total = stories.length
    const positiveRatio = counts.positive / total
    const negativeRatio = counts.negative / total

    let averageTone = 0
    let sentimentLabel: "positive" | "neutral" | "negative" = "neutral"

    if (positiveRatio >= 0.5) {
      sentimentLabel = "positive"
      averageTone = Math.round(positiveRatio * 5 * 10) / 10
    } else if (negativeRatio >= 0.4) {
      sentimentLabel = "negative"
      averageTone = -Math.round(negativeRatio * 5 * 10) / 10
    } else {
      averageTone = Math.round((positiveRatio - negativeRatio) * 3 * 10) / 10
    }

    // Build top sources from stories
    const sourceCounts: Record<string, number> = {}
    for (const s of stories) {
      const src = s.sourceName || "Unknown"
      sourceCounts[src] = (sourceCounts[src] || 0) + 1
    }

    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([source, count]) => ({ source, count }))

    const data = {
      articles: stories.slice(0, 20).map((s) => ({
        url: s.sourceUrl || "",
        title: s.headline,
        source: s.sourceName || "",
        domain: s.sourceName || "",
        language: "English",
        seenDate: s.publishedAt.slice(0, 10),
        tone: s.sentiment === "positive" ? 2 : s.sentiment === "concerning" ? -2 : 0,
        socialImage: null,
      })),
      averageTone,
      sentimentLabel,
      toneDistribution: counts,
      topSources,
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/sentiment] Failed:", err)
    return NextResponse.json({ data: null })
  }
}
