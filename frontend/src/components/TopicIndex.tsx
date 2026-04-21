import Link from "next/link"
import { TOPICS, TOPIC_CATEGORIES, type TopicCategory } from "@/lib/topics"

interface TopicIndexProps {
    counts: Record<string, number>
}

// A single topic card. Purely informational for v1 — links to the /topics/[slug]
// page which isn't built yet. Until Phase 2 ships, clicking a card will 404;
// keep that in mind when wiring this into the homepage nav.
function TopicCard({
    slug,
    label,
    shortDescription,
    storyCount,
}: {
    slug: string
    label: string
    shortDescription: string
    storyCount: number
}) {
    return (
        <Link
            href={`/topics/${slug}`}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                padding: "16px 18px",
                borderRadius: "10px",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-primary)",
                textDecoration: "none",
                color: "inherit",
                transition: "border-color 120ms ease, transform 120ms ease",
            }}
            className="topic-card"
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                <h3
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {label}
                </h3>
                <span
                    style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: storyCount > 0 ? "var(--accent-primary)" : "var(--text-muted)",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {storyCount} {storyCount === 1 ? "story" : "stories"}
                </span>
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--text-secondary)", margin: 0 }}>
                {shortDescription}
            </p>
        </Link>
    )
}

export default function TopicIndex({ counts }: TopicIndexProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
            {TOPIC_CATEGORIES.map((category) => {
                const topicsInCategory = TOPICS.filter((t) => t.category === (category as TopicCategory))
                return (
                    <section key={category}>
                        <h2
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "13px",
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "var(--accent-primary)",
                                marginBottom: "14px",
                            }}
                        >
                            {category}
                        </h2>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: "12px",
                            }}
                        >
                            {topicsInCategory.map((topic) => (
                                <TopicCard
                                    key={topic.slug}
                                    slug={topic.slug}
                                    label={topic.label}
                                    shortDescription={topic.shortDescription}
                                    storyCount={counts[topic.slug] ?? 0}
                                />
                            ))}
                        </div>
                    </section>
                )
            })}
        </div>
    )
}
