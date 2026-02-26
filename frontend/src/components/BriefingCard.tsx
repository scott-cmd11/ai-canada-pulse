import { stories } from "@/lib/mock-data"

const categoryColors: Record<string, { border: string; badge: string; text: string }> = {
  "Jobs & Money":      { border: "#2563eb", badge: "#dbeafe", text: "#1d4ed8" },
  "Homes & Rent":      { border: "#7c3aed", badge: "#ede9fe", text: "#6d28d9" },
  "Your Government":   { border: "#dc2626", badge: "#fee2e2", text: "#b91c1c" },
  "Canada & the US":   { border: "#d97706", badge: "#fef3c7", text: "#b45309" },
  "Climate":           { border: "#16a34a", badge: "#dcfce7", text: "#15803d" },
}

const sentimentConfig: Record<string, { label: string; color: string }> = {
  positive:   { label: "Good news", color: "#16a34a" },
  neutral:    { label: "Steady",    color: "#d97706" },
  concerning: { label: "Heads up",  color: "#dc2626" },
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "just now"
  if (diff === 1) return "1 min ago"
  if (diff < 60) return `${diff} min ago`
  const h = Math.floor(diff / 60)
  return h === 1 ? "1 hr ago" : `${h} hrs ago`
}

export default function BriefingCard() {
  const topStory = stories.find((s) => s.isBriefingTop)
  if (!topStory) return null

  const cat = categoryColors[topStory.category] ?? { border: "#6b7280", badge: "#f3f4f6", text: "#374151" }
  const sent = sentimentConfig[topStory.sentiment]

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Top Story
      </h2>

      <article
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex"
      >
        {/* Left colour stripe keyed to category */}
        <div className="w-1.5 flex-shrink-0" style={{ background: cat.border }} />

        <div className="p-5 sm:p-6 flex flex-col gap-3 flex-1">
          {/* Category + sentiment + region row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cat.badge, color: cat.text }}
            >
              {topStory.category}
            </span>
            <span className="text-xs font-medium" style={{ color: sent.color }}>
              {sent.label}
            </span>
            <span className="ml-auto text-xs text-gray-400">{topStory.region}</span>
          </div>

          {/* Headline */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
            {topStory.headline}
          </h3>

          {/* Full summary */}
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {topStory.summary}
          </p>

          {/* Timestamp */}
          <p className="text-xs text-gray-400">{relativeTime(topStory.publishedAt)}</p>
        </div>
      </article>
    </div>
  )
}
