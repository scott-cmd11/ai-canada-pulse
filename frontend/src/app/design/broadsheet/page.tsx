"use client"

import Link from "next/link"
import { Newsreader, Inter_Tight } from "next/font/google"
import { usePolling } from "@/hooks/usePolling"
import { relativeTime } from "@/lib/relative-time"
import type { Story } from "@/lib/mock-data"
import type { Indicator } from "@/lib/indicators-data"
import styles from "./broadsheet.module.css"

const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-broadsheet-display",
})

const body = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-broadsheet-ui",
})

interface StoriesPayload { stories: Story[] }

const transformStories = (j: Record<string, unknown>): StoriesPayload =>
  ({ stories: (j.stories as Story[] | undefined) ?? [] })

const transformIndicators = (j: Record<string, unknown>): Indicator[] | null =>
  Array.isArray(j) ? (j as Indicator[]) : null

function todayFolio(): string {
  const d = new Date()
  const date = d.toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).toUpperCase()
  // deterministic-ish issue number from day-of-year so it doesn't shift each render
  const start = new Date(d.getFullYear(), 0, 0)
  const day = Math.floor((d.getTime() - start.getTime()) / 86400000)
  const issue = String(day).padStart(3, "0")
  return `VOL. III · NO. ${issue} · ${date}`
}

function formatIndicatorValue(v: number, unit: string): { value: string; unit: string } {
  if (Math.abs(v) >= 1000) return { value: v.toLocaleString("en-CA", { maximumFractionDigits: 0 }), unit }
  return { value: v.toFixed(unit === "%" ? 1 : 2), unit }
}

export default function BroadsheetPage() {
  const { data: storiesData, loading: storiesLoading } = usePolling<StoriesPayload>(
    "/api/v1/stories",
    { intervalMs: 120_000, transform: transformStories }
  )
  const { data: indicators } = usePolling<Indicator[]>(
    "/api/v1/indicators",
    { intervalMs: 120_000, transform: transformIndicators }
  )

  const stories = storiesData?.stories ?? []
  const lead = stories.find((s) => s.isBriefingTop && s.aiSummary)
    || stories.find((s) => s.aiSummary)
    || stories[0]
  const next3 = stories.filter((s) => s.id !== lead?.id).slice(0, 3)
  const aside4 = stories.filter((s) => s.id !== lead?.id).slice(3, 7)
  const indicators4 = (indicators ?? []).slice(0, 4)

  return (
    <div className={`${display.variable} ${body.variable} ${styles.page}`}>
      <div className={styles.shell}>
        <header className={styles.masthead}>
          <div className={styles.mastheadLeft}>Independent · Non-partisan</div>
          <div className={styles.wordmark}>The Canadian AI <em>Record</em></div>
          <div className={styles.mastheadRight}>Refreshed every 12 hours</div>
        </header>
        <div className={styles.subRule}>
          <span>{todayFolio()}</span>
          <span>{stories.length ? `${stories.length} signals tracked` : "Fetching live signals…"}</span>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <h1>
              The state of <span className={styles.accentWord}>Canadian AI</span>, on the record.
            </h1>
            <p className={styles.deck}>
              An editorial intelligence brief for the people building, funding, and governing
              the country&apos;s artificial-intelligence economy.
            </p>
            <p className={styles.byline}>
              <span className={styles.live}>Now reporting</span>
              <span>17 public sources</span>
              <span>9 leading indicators</span>
              <span>Edited in Winnipeg</span>
            </p>
          </div>
          <aside className={styles.heroAside}>
            <h3>Today&apos;s wire</h3>
            <ul>
              {(stories.slice(0, 4)).map((s) => (
                <li key={s.id}>
                  <span>{s.category}</span>
                  {s.headline}
                </li>
              ))}
              {storiesLoading && Array.from({ length: 4 }).map((_, i) => (
                <li key={`sk-${i}`}><div className={styles.skeleton} style={{ height: 16 }} /></li>
              ))}
            </ul>
          </aside>
        </section>

        <div className={styles.sectionHead}>
          <h2>Lead signal</h2>
          <small>Acceleration · Curated by editors</small>
        </div>

        {lead ? (
          <div className={styles.lead}>
            <article>
              <p className={styles.leadEyebrow}>
                {lead.category} · {lead.region} · {lead.sourceName ?? "Multiple sources"}
              </p>
              <h3 className={styles.leadHeadline}>{lead.headline}</h3>
              <p className={styles.leadBody}>
                {lead.aiSummary || lead.summary || "Full briefing forthcoming."}
              </p>
              <div className={styles.leadMeta}>
                <span>{relativeTime(lead.publishedAt)}</span>
                {lead.sourceUrl && (
                  <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Read primary source →
                  </a>
                )}
              </div>
            </article>
            <aside className={styles.leadAside}>
              <h4>Also on the wire</h4>
              <ol>
                {(next3.length ? next3 : aside4).map((s) => (
                  <li key={s.id}>
                    {s.sourceUrl ? (
                      <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {s.headline}
                        <small>{s.category} · {relativeTime(s.publishedAt)}</small>
                      </a>
                    ) : (
                      <div>
                        {s.headline}
                        <small>{s.category} · {relativeTime(s.publishedAt)}</small>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        ) : (
          <div className={styles.skeleton} style={{ height: 240 }} />
        )}

        <div className={styles.sectionHead}>
          <h2>The numbers, today</h2>
          <small>Statistics Canada · Bank of Canada · Markets</small>
        </div>

        <div className={styles.indicators}>
          {indicators4.length > 0
            ? indicators4.map((ind) => {
                const last = ind.data[ind.data.length - 1]
                const prev = ind.data[ind.data.length - 2]
                const delta = last && prev ? last.value - prev.value : null
                const fmt = last ? formatIndicatorValue(last.value, ind.unit) : null
                return (
                  <div className={styles.indicator} key={ind.id}>
                    <p className={styles.indicatorLabel}>{ind.title}</p>
                    {fmt ? (
                      <>
                        <div className={styles.indicatorValue}>
                          {fmt.value}<small>{fmt.unit}</small>
                        </div>
                        {delta !== null && (
                          <div className={`${styles.indicatorTrend} ${delta >= 0 ? styles.up : styles.down}`}>
                            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)} {ind.unit} vs. prior
                          </div>
                        )}
                        <p className={styles.indicatorDesc}>{ind.description}</p>
                      </>
                    ) : (
                      <div className={styles.skeleton} />
                    )}
                  </div>
                )
              })
            : Array.from({ length: 4 }).map((_, i) => (
                <div className={styles.indicator} key={`isk-${i}`}>
                  <div className={styles.skeleton} />
                </div>
              ))}
        </div>

        <footer className={styles.proto}>
          <span>Prototype · Direction A · Broadsheet</span>
          <Link href="/design">← Back to all directions</Link>
        </footer>
      </div>
    </div>
  )
}
