import { NextResponse } from "next/server"

export async function GET() {
  try {
    const params = new URLSearchParams({
      query: '("artificial intelligence" OR "machine learning") sourcecountry:CA',
      mode: "ArtList",
      maxrecords: "50",
      format: "json",
      sort: "DateDesc",
    })

    const url = `https://api.gdeltproject.org/api/v2/doc/doc?${params}`
    const res = await fetch(url, {
      headers: { "User-Agent": "AICanadaPulse/1.0" },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ data: null })
    }

    const text = await res.text()
    if (!text.startsWith("{") && !text.startsWith("[")) {
      return NextResponse.json({ data: null })
    }

    const json = JSON.parse(text)
    const rawArticles = json.articles ?? []

    interface RawArticle {
      url?: string
      title?: string
      source?: string
      domain?: string
      language?: string
      seendate?: string
      socialimage?: string
    }

    const articles = rawArticles.map((a: RawArticle) => ({
      url: a.url || "",
      title: a.title || "Untitled",
      source: a.source || "",
      domain: a.domain || "",
      language: a.language || "English",
      seenDate: formatGdeltDate(a.seendate || ""),
      tone: 0,
      socialImage: a.socialimage || null,
    }))

    const total = articles.length
    const data = {
      articles: articles.slice(0, 20),
      averageTone: 0,
      sentimentLabel: "neutral" as const,
      toneDistribution: { positive: 0, neutral: total, negative: 0 },
      topSources: getTopSources(articles),
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, max-age=10800, stale-while-revalidate=3600",
        },
      }
    )
  } catch (err) {
    console.warn("[api/sentiment] Failed:", err)
    return NextResponse.json({ data: null })
  }
}

function formatGdeltDate(raw: string): string {
  if (raw.length >= 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return raw
}

function getTopSources(articles: Array<{ domain: string; source: string }>): Array<{ source: string; count: number }> {
  const counts: Record<string, number> = {}
  for (const a of articles) {
    const src = a.domain || a.source
    counts[src] = (counts[src] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([source, count]) => ({ source, count }))
}
