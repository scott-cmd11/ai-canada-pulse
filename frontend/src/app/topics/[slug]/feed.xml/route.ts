import { fetchAllStories } from "@/lib/rss-client"
import { hydrateCanadaStories } from "@/lib/dashboard-enrichment"
import { getTopicBySlug } from "@/lib/topics"
import type { Story } from "@/lib/mock-data"

export const dynamic = "force-dynamic"
// Cache at the edge for 10 minutes — feed readers poll frequently but
// underlying story data only refreshes via the daily cron.
export const revalidate = 600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-canada-pulse.vercel.app"

function escapeXml(raw: string): string {
    return raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}

function wrapCdata(raw: string): string {
    return `<![CDATA[${raw.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`
}

function toRfc822(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return new Date().toUTCString()
    return d.toUTCString()
}

function storyItem(story: Story, topicUrl: string): string {
    const link = story.sourceUrl || topicUrl
    const guid = story.sourceUrl || `${topicUrl}#${story.id}`
    const description = story.aiSummary || story.summary || ""
    const category = story.category
    const source = story.sourceName ? `<source url="${escapeXml(link)}">${escapeXml(story.sourceName)}</source>` : ""
    return `    <item>
      <title>${wrapCdata(story.headline)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="${story.sourceUrl ? "true" : "false"}">${escapeXml(guid)}</guid>
      <pubDate>${toRfc822(story.publishedAt)}</pubDate>
      <description>${wrapCdata(description)}</description>
      <category>${escapeXml(category)}</category>
      ${source}
    </item>`
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> },
) {
    const { slug } = await params
    const topic = getTopicBySlug(slug)
    if (!topic) {
        return new Response("Unknown topic", { status: 404 })
    }

    const topicUrl = `${SITE_URL}/topics/${slug}`
    const feedUrl = `${topicUrl}/feed.xml`

    let items: Story[] = []
    let generatedAt: string | null = null
    try {
        const raw = await fetchAllStories()
        const hydrated = await hydrateCanadaStories(raw)
        items = hydrated.stories.filter((s) => s.topics?.includes(slug)).slice(0, 50)
        generatedAt = hydrated.generatedAt
    } catch (err) {
        console.warn(`[feed.xml/${slug}] Failed to load stories:`, err)
    }

    const lastBuild = toRfc822(generatedAt || new Date().toISOString())

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${wrapCdata(`${topic.label} — AI Canada Pulse`)}</title>
    <link>${escapeXml(topicUrl)}</link>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>${wrapCdata(topic.shortDescription)}</description>
    <language>en-ca</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <ttl>60</ttl>
${items.map((s) => storyItem(s, topicUrl)).join("\n")}
  </channel>
</rss>`

    return new Response(xml, {
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
        },
    })
}
