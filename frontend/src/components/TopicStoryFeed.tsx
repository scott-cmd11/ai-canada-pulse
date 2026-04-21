"use client"

import { useCallback } from "react"
import StoryCard from "@/components/StoryCard"
import { usePolling } from "@/hooks/usePolling"
import type { Story } from "@/lib/mock-data"

interface Props {
    slug: string
}

interface FeedResponse {
    stories: Story[]
    generatedAt: string | null
}

export default function TopicStoryFeed({ slug }: Props) {
    const transform = useCallback(
        (json: Record<string, unknown>): FeedResponse => ({
            stories: (json.stories as Story[]) ?? [],
            generatedAt: (json.generatedAt as string | null) ?? null,
        }),
        [],
    )
    const isEmpty = useCallback((d: FeedResponse) => d.stories.length === 0, [])
    const { data, loading } = usePolling<FeedResponse>(`/api/v1/topics/${slug}/stories`, {
        transform,
        isEmpty,
    })

    if (loading && !data) {
        return (
            <div
                style={{
                    padding: "24px 0",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                }}
            >
                Loading tagged stories…
            </div>
        )
    }

    const stories = data?.stories ?? []

    if (stories.length === 0) {
        return (
            <div
                style={{
                    padding: "24px 0",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                }}
            >
                No stories tagged to this topic in the current cycle. Check back after the next refresh at 12:00 UTC.
            </div>
        )
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
            ))}
        </div>
    )
}
