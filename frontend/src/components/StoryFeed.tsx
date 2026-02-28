"use client"

import { useState, useEffect } from "react"
import type { Category, Story } from "@/lib/mock-data"
import StoryCard from "./StoryCard"

const ALL = "All"

const CATEGORIES: { value: typeof ALL | Category; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Research", label: "Research" },
  { value: "Policy & Regulation", label: "Policy" },
  { value: "Industry & Startups", label: "Startups" },
  { value: "Talent & Education", label: "Talent" },
  { value: "Global AI Race", label: "Global" },
]

export default function StoryFeed() {
  const [active, setActive] = useState<typeof ALL | Category>(ALL)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((res) => res.json())
      .then((json) => {
        if (json.stories && json.stories.length > 0) {
          setStories(json.stories)
        }
      })
      .catch((err) => console.warn("[StoryFeed] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  const feedStories = stories.filter((s) => !s.isBriefingTop)

  const filtered = active === ALL
    ? feedStories
    : feedStories.filter((s) => s.category === active)

  return (
    <div>
      {/* Category tabs — underline style */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-700/50 mb-4" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActive(cat.value)}
            className={[
              "px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
              active === cat.value
                ? "tab-active"
                : "tab-inactive",
            ].join(" ")}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Story grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {loading && (
        <p className="text-xs text-slate-500 mt-4 text-center">Fetching latest stories...</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-slate-500 py-12 text-sm">No stories in this category right now.</p>
      )}
    </div>
  )
}
