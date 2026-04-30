import type { ReactNode } from "react"

interface PageHeroStat {
  label: string
  value: string
}

interface PageHeroProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  stats?: PageHeroStat[]
  actions?: ReactNode
  compact?: boolean
}

export default function PageHero({ eyebrow, title, description, stats, actions, compact = false }: PageHeroProps) {
  return (
    <section className="page-hero" data-compact={compact ? "true" : "false"}>
      <div className="page-hero-copy">
        <p className="page-hero-kicker">
          <span aria-hidden="true" />
          {eyebrow}
        </p>
        <h1>{title}</h1>
        {description ? <p className="page-hero-description">{description}</p> : null}
        {actions ? <div className="page-hero-actions">{actions}</div> : null}
      </div>

      {stats && stats.length > 0 ? (
        <div className="page-hero-stats" aria-label="Page highlights">
          {stats.map((stat) => (
            <div key={`${stat.label}-${stat.value}`}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
