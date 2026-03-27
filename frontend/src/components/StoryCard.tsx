import type { Story } from "@/lib/mock-data"
import { relativeTime } from "@/lib/relative-time"
import AILabel from '@/components/AILabel'

interface Props {
  story: Story
}

export default function StoryCard({ story }: Props) {
  const categoryLabel = story.category === "Industry & Startups"
    ? "Markets"
    : story.category === "Policy & Regulation"
      ? "Policy"
      : story.category === "Global AI Race"
        ? "Geopolitics"
        : story.category

  return (
    <article className="saas-card flex flex-col gap-4 bg-white/92 p-5 sm:flex-row sm:gap-5">
      <div className="mt-0.5 flex shrink-0 gap-3 sm:w-32 sm:flex-col sm:gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {relativeTime(story.publishedAt)}
        </span>
        <span className="self-start rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
          {categoryLabel}
        </span>
        <AILabel level="classification" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="space-y-2.5">
          <h3 className="text-lg font-semibold leading-snug text-slate-950">
            {story.sourceUrl ? (
              <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">
                {story.headline}
              </a>
            ) : (
              story.headline
            )}
          </h3>

          {story.aiSummary ? (
            <div>
              <AILabel level="summary" sourceUrl={story.sourceUrl} sourceName={story.sourceName} />
              <p className="text-sm leading-7 text-slate-700">
                {story.aiSummary}
              </p>
            </div>
          ) : story.summary && !story.headline.startsWith(story.summary.split("  ")[0]) ? (
            <p className="text-sm leading-7 text-slate-600">
              {story.summary}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
          {story.sourceName && <span>{story.sourceName}</span>}
          {story.sourceName && <span>|</span>}
          <span>{story.region}</span>
        </div>
      </div>
    </article>
  )
}