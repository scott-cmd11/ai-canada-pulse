"use client"

import { useState, useEffect } from "react"
import { stories as fallbackStories } from "@/lib/mock-data"
import type { Category, Story } from "@/lib/mock-data"
import StoryCard from "./StoryCard"

const ALL = "All"

const CATEGORIES: { value: typeof ALL | Category; label: string }[] = [
  { value: "All",                  label: "🗺️ All" },
  { value: "Research",             label: "🔬 Research" },
  { value: "Policy & Regulation",  label: "⚖️ Policy" },
  { value: "Industry & Startups",  label: "🚀 Startups" },
  { value: "Talent & Education",   label: "🎓 Talent" },
  { value: "Global AI Race",       label: "🌐 Global" },
]

export default function StoryFeed() {
  const [active, setActive] = useState<typeof ALL | Category>(ALL)
  const [stories, setStories] = useState<Story[]>(fallbackStories)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((res) => res.json())
      .then((json) => {
        if (json.stories && json.stories.length > 0) {
          setStories(json.stories)
        }
      })
      .catch(() => {}) // keep fallback
      .finally(() => setLoading(false))
  }, [])

  // Exclude the briefing top story (shown in BriefingCard above)
  const feedStories = stories.filter((s) => !s.isBriefingTop)

  const filtered = active === ALL
    ? feedStories
    : feedStories.filter((s) => s.category === active)

  return (
    <div>
      {/* Category tabs — horizontally scrollable on narrow screens */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActive(cat.value)}
            className={[
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap flex-shrink-0",
              active === cat.value
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400",
            ].join(" ")}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Story grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((story, i) => (
          <StoryCard key={story.id} story={story} cardDelay={i * 60} />
        ))}
      </div>

      {loading && (
        <p className="text-xs text-gray-400 mt-2 text-center">Fetching latest stories...</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">No stories in this category right now.</p>
      )}
    </div>
  )
}
