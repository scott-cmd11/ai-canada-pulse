"use client"

import { useEffect, useState } from "react"
import { useStories } from "@/hooks/useStories"

export default function LiveTicker() {
  const { stories: allStories } = useStories()
  const stories = allStories.slice(0, 8)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!stories || stories.length <= 1) return

    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % stories.length)
        setVisible(true)
      }, 400)
    }, 6000)

    return () => clearInterval(interval)
  }, [stories])

  if (!stories || stories.length === 0) return null

  const story = stories[currentIndex % stories.length]

  const categoryColors: Record<string, { bg: string; text: string }> = {
    "Policy & Regulation": { bg: "color-mix(in srgb, var(--cat-policy) 10%, var(--surface-primary))", text: "var(--cat-policy)" },
    "Industry & Startups": { bg: "color-mix(in srgb, var(--cat-markets) 12%, var(--surface-primary))", text: "var(--cat-markets)" },
    Research: { bg: "color-mix(in srgb, var(--cat-research) 12%, var(--surface-primary))", text: "var(--cat-research)" },
    "Research & Development": { bg: "color-mix(in srgb, var(--cat-research) 12%, var(--surface-primary))", text: "var(--cat-research)" },
    "Funding & Investment": { bg: "color-mix(in srgb, var(--cat-funding) 12%, var(--surface-primary))", text: "var(--cat-funding)" },
  }
  const catStyle = categoryColors[story.category] || { bg: "color-mix(in srgb, var(--text-muted) 12%, var(--surface-primary))", text: "var(--text-muted)" }

  return (
    <div className="live-ticker">
      <div>
        <div className="live-ticker-label">
          <span aria-hidden="true" />
          <span>Live</span>
        </div>

        <div
          className="live-ticker-story"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-6px)",
          }}
        >
          <span style={{ backgroundColor: catStyle.bg, color: catStyle.text }}>
            {story.category?.split(" ")[0]}
          </span>

          <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer">
            {story.headline}
          </a>

          <small>/ {story.sourceName}</small>
        </div>

        <span className="live-ticker-count">
          {(currentIndex % stories.length) + 1}/{stories.length}
        </span>
      </div>
    </div>
  )
}
