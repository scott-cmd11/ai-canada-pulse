import type { Topic } from "@/lib/topics"

interface Props {
    topic: Topic
    updatedAt?: string | null
    storyCount?: number
}

function formatUpdated(iso: string | null | undefined): string | null {
    if (!iso) return null
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
}

export default function TopicHero({ topic, updatedAt, storyCount }: Props) {
    const updatedLabel = formatUpdated(updatedAt)
    return (
        <header
            style={{
                paddingBottom: "28px",
                borderBottom: "1px solid var(--border-subtle)",
                marginBottom: "32px",
            }}
        >
            <p
                style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--accent-primary)",
                    marginBottom: "10px",
                }}
            >
                {topic.category}
            </p>
            <h1
                style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "32px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    marginBottom: "12px",
                    lineHeight: 1.15,
                }}
            >
                {topic.label}
            </h1>
            <p
                style={{
                    fontSize: "16px",
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                    maxWidth: "640px",
                    marginBottom: "18px",
                }}
            >
                {topic.heroLede}
            </p>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                }}
            >
                {updatedLabel && (
                    <span>
                        Last updated <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{updatedLabel}</span>
                    </span>
                )}
                {typeof storyCount === "number" && (
                    <span>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{storyCount}</span>{" "}
                        {storyCount === 1 ? "story" : "stories"} tagged this cycle
                    </span>
                )}
            </div>
        </header>
    )
}
