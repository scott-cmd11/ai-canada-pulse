import type { Story } from "@/lib/mock-data"
import { relativeTime } from "@/lib/relative-time"
import AILabel from '@/components/AILabel'
import ShareButtons from '@/components/ShareButtons'
import CategoryGlyph from '@/components/CategoryGlyph'

interface Props {
  story: Story
}

function isSummaryRedundant(headline: string, summary: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  const h = norm(headline)
  const s = norm(summary)

  // Too short to add value
  if (s.length < 20) return true

  // One contains the other
  if (s.startsWith(h) || h.startsWith(s)) return true

  // Word-level Jaccard similarity — redundant if >60% overlap
  const hWords = h.split(/\s+/)
  const sWords = s.split(/\s+/)
  const sWordSet = new Set(sWords)
  let overlap = 0
  hWords.forEach(w => { if (sWordSet.has(w)) overlap++ })
  const allWords = new Set(hWords.concat(sWords))
  if (allWords.size > 0 && overlap / allWords.size > 0.6) return true

  return false
}

const categoryColors: Record<string, string> = {
  "Policy & Regulation": "var(--cat-policy)",
  "Industry & Startups": "var(--cat-markets)",
  "Research": "var(--cat-research)",
  "Research & Development": "var(--cat-research)",
  "Funding & Investment": "var(--cat-funding)",
  "Global AI Race": "var(--cat-geopolitics)",
}

export default function StoryCard({ story }: Props) {
  const categoryLabel = story.category === "Industry & Startups"
    ? "Markets"
    : story.category === "Policy & Regulation"
      ? "Policy"
      : story.category === "Global AI Race"
        ? "Geopolitics"
        : story.category

  const catColor = categoryColors[story.category] || "var(--accent-primary)"

  return (
    <article className="saas-card flex flex-col gap-4 p-5 sm:flex-row sm:gap-5">
      <div className="mt-0.5 flex shrink-0 gap-3 sm:w-32 sm:flex-col sm:gap-2">
        <span className="meta" style={{ letterSpacing: '0.14em' }}>
          {relativeTime(story.publishedAt)}
        </span>
        <div className="flex items-center gap-2 self-start">
          <CategoryGlyph category={story.category} size={28} />
          <span className="chip rounded-full border px-2.5 py-1" style={{ borderColor: `color-mix(in srgb, ${catColor} 25%, transparent)`, backgroundColor: `color-mix(in srgb, ${catColor} 10%, transparent)`, color: catColor }}>
            {categoryLabel}
          </span>
        </div>
        {!story.aiSummary && <AILabel level="classification" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="space-y-2.5">
          <h3 className="text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {story.sourceUrl ? (
              <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="story-headline-link hover:underline focus-visible:underline focus-visible:outline-none" style={{ color: 'var(--text-primary)', transition: 'color 0.15s ease' }}>
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
          ) : story.summary && !isSummaryRedundant(story.headline, story.summary) ? (
            <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {story.summary}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="meta flex flex-1 flex-wrap items-center gap-2">
            {!story.aiSummary && story.sourceName && <span>{story.sourceName}</span>}
            {!story.aiSummary && story.sourceName && <span aria-hidden="true">·</span>}
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