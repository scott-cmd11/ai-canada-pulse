import type { MetadataRoute } from "next"
import { TOPICS } from "@/lib/topics"
import { hasTopicContent } from "@/lib/topic-content"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-canada-pulse.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date()

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
        { url: `${SITE_URL}/dashboard`, lastModified: now, changeFrequency: "hourly", priority: 1.0 },
        { url: `${SITE_URL}/topics`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
        { url: `${SITE_URL}/insights`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
        { url: `${SITE_URL}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
        { url: `${SITE_URL}/subscribe`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
        { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
        { url: `${SITE_URL}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ]

    const topicRoutes: MetadataRoute.Sitemap = TOPICS.map((t) => ({
        url: `${SITE_URL}/topics/${t.slug}`,
        lastModified: now,
        // Flagship topics (those with explainer content) update more often
        // as editorial refreshes land; long-tail topics are effectively static
        // until their content ships.
        changeFrequency: hasTopicContent(t.slug) ? "weekly" : "monthly",
        priority: hasTopicContent(t.slug) ? 0.8 : 0.6,
    }))

    return [...staticRoutes, ...topicRoutes]
}
