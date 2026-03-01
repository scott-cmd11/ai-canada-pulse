import type { Story } from "@/lib/mock-data"

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "Just updated"
  if (diff === 1) return "1 min ago"
  if (diff < 60) return `${diff} min ago`
  const h = Math.floor(diff / 60)
  if (h < 24) return h === 1 ? "1 hr ago" : `${h} hrs ago`
  const d = Math.floor(h / 24)
  return d === 1 ? "1 day ago" : `${d} days ago`
}

interface Props {
  story: Story
}

export default function StoryCard({ story }: Props) {
  return (
    <article
      className="saas-card bg-white p-5 flex flex-col sm:flex-row gap-4"
    >
      {/* Removed fixed width w-[150px] constraint to prevent layout breakages */}
      <div className="flex sm:flex-col sm:w-32 shrink-0 gap-3 sm:gap-1.5 mt-0.5">
        <span className="text-xs font-medium text-slate-500">
          {relativeTime(story.publishedAt)}
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 self-start">
          {story.category === "Industry & Startups" ? "Markets" :
            story.category === "Policy & Regulation" ? "Policy" :
              story.category === "Global AI Race" ? "Geopolitics" :
                story.category}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <h3 className="text-base font-bold text-slate-900 leading-snug">
          {story.sourceUrl ? (
            <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">
              {story.headline}
            </a>
          ) : (
            story.headline
          )}
        </h3>

        {/* Prefer AI summary when available, fall back to raw RSS snippet */}
        {story.aiSummary ? (
          <p className="text-sm text-slate-700 leading-relaxed mt-1">
            <span className="text-indigo-500 text-xs mr-1">✦</span>
            {story.aiSummary}
          </p>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed mt-1">
            {story.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-medium text-slate-500">
          {story.sourceName && <span>{story.sourceName}</span>}
          {story.sourceName && <span className="text-slate-300">•</span>}
          <span>{story.region}</span>
        </div>
      </div>
    </article>
  )
}
