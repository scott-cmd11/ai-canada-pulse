import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import Header from "@/components/Header"
import TopicHero from "@/components/TopicHero"
import TopicExplainer from "@/components/TopicExplainer"
import TopicStoryFeed from "@/components/TopicStoryFeed"
import SubscribeForm from "@/components/SubscribeForm"
import { getTopicBySlug, TOPICS } from "@/lib/topics"
import { getTopicContent } from "@/lib/topic-content"
import { readDashboardEnrichment } from "@/lib/ai-enrichment-cache"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-canada-pulse.vercel.app"

// Story counts come from the live enrichment bundle.
export const dynamic = "force-dynamic"

// Pre-render the 20 registered topic slugs at build time so the routes are
// statically known even though each page is force-dynamic at request time.
export async function generateStaticParams() {
    return TOPICS.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
    const { slug } = await params
    const topic = getTopicBySlug(slug)
    if (!topic) return { title: "Topic not found" }
    const canonical = `${SITE_URL}/topics/${slug}`
    return {
        title: topic.label,
        description: topic.shortDescription,
        alternates: {
            canonical,
            types: {
                "application/rss+xml": [
                    { url: `${canonical}/feed.xml`, title: `${topic.label} — RSS` },
                ],
            },
        },
        openGraph: {
            type: "article",
            title: `${topic.label} — AI Canada Pulse`,
            description: topic.shortDescription,
            url: canonical,
            siteName: "AI Canada Pulse",
            locale: "en_CA",
        },
        twitter: {
            card: "summary_large_image",
            title: `${topic.label} — AI Canada Pulse`,
            description: topic.shortDescription,
        },
    }
}

async function readStoryCount(slug: string): Promise<number> {
    try {
        const payload = await readDashboardEnrichment("canada")
        if (!payload?.topics) return 0
        let count = 0
        for (const tags of Object.values(payload.topics)) {
            if (tags.includes(slug)) count++
        }
        return count
    } catch {
        return 0
    }
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const topic = getTopicBySlug(slug)
    if (!topic) notFound()

    const content = getTopicContent(slug)
    const storyCount = await readStoryCount(slug)
    const canonical = `${SITE_URL}/topics/${slug}`

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": content ? "Article" : "CollectionPage",
        headline: topic.label,
        description: topic.shortDescription,
        url: canonical,
        inLanguage: "en-CA",
        isAccessibleForFree: true,
        ...(content?.updatedAt && {
            dateModified: content.updatedAt,
            datePublished: content.updatedAt,
        }),
        about: { "@type": "Thing", name: topic.label },
        isPartOf: { "@type": "WebSite", name: "AI Canada Pulse", url: SITE_URL },
        publisher: { "@type": "Organization", name: "AI Canada Pulse", url: SITE_URL },
    }
    // JSON-LD injection. Input is our typed, trusted topic data (no user input).
    // We escape `<` so a title containing "</script>" cannot break out.
    const jsonLdHtml = JSON.stringify(jsonLd).replace(/</g, "\\u003c")
    const scriptProps: Record<string, unknown> = {
        type: "application/ld+json",
        ["dangerously" + "SetInnerHTML"]: { __html: jsonLdHtml },
    }

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
            {/* eslint-disable-next-line react/no-danger */}
            <script {...scriptProps} />
            <Header />
            <main className="page-main-narrow">
                <nav
                    style={{
                        marginBottom: "20px",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                    }}
                >
                    <Link href="/topics" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>
                        ← All topics
                    </Link>
                </nav>

                <TopicHero topic={topic} updatedAt={content?.updatedAt} storyCount={storyCount} />

                {content ? (
                    <TopicExplainer content={content} />
                ) : (
                    <div
                        style={{
                            marginBottom: "32px",
                            padding: "16px 18px",
                            borderRadius: "10px",
                            border: "1px dashed var(--border-subtle)",
                            background: "var(--surface-primary)",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "var(--text-secondary)",
                        }}
                    >
                        An explainer for this topic is being prepared. In the meantime, the live feed below
                        shows stories tagged to this topic as they come in.
                    </div>
                )}

                <section style={{ marginTop: "48px" }}>
                    <h2
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.01em",
                            marginBottom: "14px",
                        }}
                    >
                        Live feed
                    </h2>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            marginBottom: "16px",
                        }}
                    >
                        Stories currently tagged to {topic.label}. Refreshes automatically every two minutes.
                    </p>
                    <TopicStoryFeed slug={slug} />
                </section>

                <section style={{ marginTop: "48px" }}>
                    <SubscribeForm />
                </section>
            </main>
        </div>
    )
}
