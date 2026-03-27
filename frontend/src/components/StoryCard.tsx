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
    <article className="saas-card flex flex-col gap-4 p-5 sm:flex-row sm:gap-5">
      <div className="mt-0.5 flex shrink-0 gap-3 sm:w-32 sm:flex-col sm:gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
          {relativeTime(story.publishedAt)}
        </span>
        <span className="self-start rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', color: 'var(--accent-primary)' }}>
          {categoryLabel}
        </span>
        <AILabel level="classification" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="space-y-2.5">
          <h3 className="text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {story.sourceUrl ? (
              <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>
                {story.headline}
              </a>
            ) : (
              story.headline
            )}
          </h3>

          {story.aiSummary ? (
            <div>
              <AILabel level="summary" sourceUrl={story.sourceUrl} sourceName={story.sourceName} />
              <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                {story.aiSummary}
              </p>
            </div>
          ) : story.summary && !story.headline.startsWith(story.summary.split("  ")[0]) ? (
            <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {story.summary}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          {story.sourceName && <span>{story.sourceName}</span>}
          {story.sourceName && <span>|</span>}
          <span>{story.region}</span>
        </div>
      </div>
    </article>
  )
}