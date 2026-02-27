import type { Story } from "@/lib/mock-data"

const sentimentLabel: Record<string, { label: string; color: string }> = {
  positive:   { label: "Positive",  color: "#10b981" },
  neutral:    { label: "Neutral",   color: "#64748b" },
  concerning: { label: "Negative",  color: "#ef4444" },
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

export default function StoryCard({ story }: Props) {
  const sent = sentimentLabel[story.sentiment] ?? sentimentLabel.neutral

  return (
    <article className="bg-slate-800/60 rounded border border-slate-700/50 p-4 card-hover flex flex-col gap-2">
      {/* Meta row */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">{story.category}</span>
        <span className="text-slate-600">|</span>
        <span style={{ color: sent.color }} className="font-medium">{sent.label}</span>
        {story.sourceName && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">{story.sourceName}</span>
          </>
        )}
        <span className="ml-auto text-slate-500">{relativeTime(story.publishedAt)}</span>
      </div>

      {/* Headline */}
      <h3 className="text-sm font-semibold text-slate-200 leading-snug">
        {story.headline}
      </h3>

      {/* Summary */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
        {story.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-auto pt-1">
        <span className="text-xs text-slate-500">{story.region}</span>
        {story.sourceUrl && (
          <a
            href={story.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 ml-auto"
          >
            Source &#8599;
          </a>
        )}
      </div>
    </article>
  )
}
