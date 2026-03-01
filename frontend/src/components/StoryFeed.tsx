"use client"

import { useState, useEffect } from "react"
import type { Category, Story } from "@/lib/mock-data"
import StoryCard from "./StoryCard"

const ALL = "All Intelligence"

const CATEGORIES: { value: typeof ALL | Category; label: string }[] = [
  { value: "All Intelligence", label: "All Intelligence" },
  { value: "Research", label: "Research" },
  { value: "Policy & Regulation", label: "Policy" },
  { value: "Industry & Startups", label: "Markets" },
  { value: "Talent & Education", label: "Talent" },
  { value: "Global AI Race", label: "Geopolitics" },
]

const PAGE_SIZE = 10

export default function StoryFeed() {
  const [active, setActive] = useState<typeof ALL | Category>(ALL)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

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

  const mapBackToValue = (cat: string) => {
    if (cat === "Markets & Startups" || cat === "Markets") return "Industry & Startups"
    if (cat === "Geopolitics") return "Global AI Race"
    if (cat === "Policy") return "Policy & Regulation"
    return cat
  }

  const filtered = active === ALL
    ? feedStories
    : feedStories.filter((s) => s.category === active || s.category === mapBackToValue(active))

  const visible = filtered.slice(0, displayCount)

  return (
    <div className="flex flex-col gap-6">
      {/* Category tabs - Scrollable logic without clipping text */}
      <div className="flex gap-6 overflow-x-auto border-b border-slate-200" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => { setActive(cat.value); setDisplayCount(PAGE_SIZE) }}
            className={[
              "py-3 text-sm font-medium whitespace-nowrap flex-shrink-0 cursor-pointer",
              active === cat.value ? "tab-active" : "tab-inactive",
            ].join(" ")}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {visible.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {filtered.length > displayCount && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
            className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm"
          >
            Load Additional Reports
          </button>
        </div>
      )}

      {loading && (
        <div className="py-12 flex justify-center">
          <p className="text-sm font-medium text-slate-500">Retrieving intelligence reports...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-12 flex justify-center">
          <p className="text-sm font-medium text-slate-500">No reports matching current criteria.</p>
        </div>
      )}
    </div>
  )
}
