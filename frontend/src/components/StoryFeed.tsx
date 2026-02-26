"use client"

import { useState } from "react"
import { stories } from "@/lib/mock-data"
import type { Category } from "@/lib/mock-data"
import StoryCard from "./StoryCard"

const ALL = "All"

const CATEGORIES: { value: typeof ALL | Category; label: string }[] = [
  { value: "All",              label: "🗺️ All" },
  { value: "Jobs & Money",     label: "💼 Jobs & Money" },
  { value: "Homes & Rent",     label: "🏠 Homes & Rent" },
  { value: "Your Government",  label: "🏛️ Your Government" },
  { value: "Canada & the US",  label: "🌐 Canada & the US" },
  { value: "Climate",          label: "🌿 Climate" },
]

export default function StoryFeed() {
  const [active, setActive] = useState<typeof ALL | Category>(ALL)

  const filtered = active === ALL
    ? stories
    : stories.filter((s) => s.category === active)

  return (
    <section>
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
        {filtered.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">No stories in this category right now.</p>
      )}
    </section>
  )
}
