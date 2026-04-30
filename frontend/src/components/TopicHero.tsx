import type { Topic } from "@/lib/topics"
import PageHero from "@/components/PageHero"

interface Props {
    topic: Topic
    updatedAt?: string | null
    storyCount?: number
}

function formatUpdated(iso: string | null | undefined): string | null {
    if (!iso) return null
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
}

export default function TopicHero({ topic, updatedAt, storyCount }: Props) {
    const updatedLabel = formatUpdated(updatedAt)
    return (
        <PageHero
            eyebrow={topic.category}
            title={<>{topic.label}</>}
            description={topic.heroLede}
            stats={[
                { label: "Stories", value: `${storyCount ?? 0}` },
                { label: "Updated", value: updatedLabel ?? "Live" },
                { label: "View", value: "Topic" },
            ]}
            compact
        />
    )
}
