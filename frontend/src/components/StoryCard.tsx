import type { Story } from "@/lib/mock-data"

const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
  "Research":              { border: "#2563eb", bg: "#dbeafe", text: "#1d4ed8" },
  "Policy & Regulation":   { border: "#7c3aed", bg: "#ede9fe", text: "#6d28d9" },
  "Industry & Startups":   { border: "#16a34a", bg: "#dcfce7", text: "#15803d" },
  "Talent & Education":    { border: "#d97706", bg: "#fef3c7", text: "#b45309" },
  "Global AI Race":        { border: "#dc2626", bg: "#fee2e2", text: "#b91c1c" },
}

const sentimentDot: Record<string, string> = {
  positive:   "#16a34a",
  neutral:    "#d97706",
  concerning: "#dc2626",
}

const sentimentLabel: Record<string, string> = {
  positive:   "Good news",
  neutral:    "Steady",
  concerning: "Heads up",
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "just now"
  if (diff === 1) return "1 min ago"
  if (diff < 60) return `${diff} min ago`
  const h = Math.floor(diff / 60)
  if (h < 24) return h === 1 ? "1 hr ago" : `${h} hrs ago`
  const d = Math.floor(h / 24)
  return d === 1 ? "1 day ago" : `${d} days ago`
}

interface Props {
  story: Story
  cardDelay?: number
}

export default function StoryCard({ story, cardDelay = 0 }: Props) {
  const cat = categoryColors[story.category] ?? { border: "#6b7280", bg: "#f3f4f6", text: "#374151" }
  const dot = sentimentDot[story.sentiment]

  return (
    <article
      className="story-card-lift story-card-enter bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex"
      style={{ "--card-delay": `${cardDelay}ms` } as React.CSSProperties}
    >
      {/* Left colour stripe */}
      <div className="w-1 flex-shrink-0" style={{ background: cat.border }} />

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Top row: category + region + source + sentiment */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cat.bg, color: cat.text }}
          >
            {story.category}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {story.region}
          </span>
          {story.sourceName && (
            <span className="text-xs text-gray-400">via {story.sourceName}</span>
          )}
          <span
            className="ml-auto flex items-center gap-1 text-xs font-medium"
            style={{ color: dot }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
            {sentimentLabel[story.sentiment]}
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-base font-bold text-gray-900 leading-snug">{story.headline}</h3>

        {/* Summary */}
        <p className="text-sm text-gray-600 leading-snug line-clamp-2">{story.summary}</p>

        {/* Time + source link */}
        <div className="flex items-center gap-3 mt-auto pt-1">
          <p className="text-xs text-gray-400">{relativeTime(story.publishedAt)}</p>
          {story.sourceUrl && (
            <a
              href={story.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Read more &#8599;
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
