import type { Story } from "@/lib/mock-data"
import type { CSSProperties } from "react"
import { relativeTime } from "@/lib/relative-time"
import { getDisplaySummary } from "@/lib/story-summary"
import AILabel from "@/components/AILabel"
import ShareButtons from "@/components/ShareButtons"

interface Props {
  story: Story
}

const categoryColors: Record<string, string> = {
  "Policy & Regulation": "var(--cat-policy)",
  "Industry & Startups": "var(--cat-markets)",
  Research: "var(--cat-research)",
  "Research & Development": "var(--cat-research)",
  "Funding & Investment": "var(--cat-funding)",
  "Global AI Race": "var(--cat-geopolitics)",
}

export default function StoryCard({ story }: Props) {
  const displaySummary = getDisplaySummary(story)
  const categoryLabel = story.category === "Industry & Startups"
    ? "Markets"
    : story.category === "Policy & Regulation"
      ? "Policy"
      : story.category === "Global AI Race"
        ? "Geopolitics"
        : story.category

  const catColor = categoryColors[story.category] || "var(--accent-primary)"

  return (
    <article className="story-card saas-card group">
      <div className="story-card-meta">
        <span>{relativeTime(story.publishedAt)}</span>
        <span className="chip story-card-category" style={{ "--category-color": catColor } as CSSProperties}>
          {categoryLabel}
        </span>
      </div>

      <div className="story-card-body">
        <h3>
          {story.sourceUrl ? (
            <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="story-headline-link">
              {story.headline}
            </a>
          ) : (
            story.headline
          )}
        </h3>

        {displaySummary.isAi ? (
          <div>
            <AILabel level="summary" sourceUrl={story.sourceUrl} sourceName={story.sourceName} />
            <p>{displaySummary.text}</p>
          </div>
        ) : (
          <p>{displaySummary.text}</p>
        )}

        <div className="story-card-footer">
          <div>
            {!displaySummary.isAi && story.sourceName && <span>{story.sourceName}</span>}
            {!displaySummary.isAi && story.sourceName && <span aria-hidden="true">/</span>}
            <span>{story.region}</span>
          </div>
          {story.sourceUrl && (
            <ShareButtons url={story.sourceUrl} title={story.headline} />
          )}
        </div>
      </div>
    </article>
  )
}
