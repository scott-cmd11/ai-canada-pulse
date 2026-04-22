"use client"

import Link from "next/link"
import { Instrument_Serif, Inter_Tight } from "next/font/google"
import { usePolling } from "@/hooks/usePolling"
import { relativeTime } from "@/lib/relative-time"
import type { Story } from "@/lib/mock-data"
import type { Indicator } from "@/lib/indicators-data"
import styles from "./aurora.module.css"

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-aurora-display",
})

const body = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-aurora-body",
})

interface StoriesPayload { stories: Story[] }

const transformStories = (j: Record<string, unknown>): StoriesPayload =>
  ({ stories: (j.stories as Story[] | undefined) ?? [] })

const transformIndicators = (j: Record<string, unknown>): Indicator[] | null =>
  Array.isArray(j) ? (j as Indicator[]) : null

export default function AuroraPage() {
  const { data: storiesData } = usePolling<StoriesPayload>(
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
  const indicators4 = (indicators ?? []).slice(0, 4)

  // Count signals in last hour for the live pill (best-effort)
  const signalsLastHour = stories.filter((s) => {
    const t = new Date(s.publishedAt).getTime()
    return Date.now() - t < 60 * 60 * 1000
  }).length

  return (
    <div className={`${display.variable} ${body.variable} ${styles.page}`}>
      <div className={styles.shell}>
        <nav className={styles.nav}>
          <span className={styles.brand}>
            <span className={styles.glyph} />
            Canada Pulse
          </span>
          <div className={styles.navLinks}>
            <a href="#">Digest</a>
            <a href="#">Dashboard</a>
            <a href="#">Topics</a>
            <a href="#">About</a>
          </div>
        </nav>

        <section className={styles.hero}>
          <span className={styles.livePill}>
            {signalsLastHour > 0
              ? `${signalsLastHour} new signal${signalsLastHour === 1 ? "" : "s"} in the last hour`
              : `${stories.length || "…"} signals tracked today`}
          </span>
          <h1 className={styles.heroTitle}>
            Canadian AI,<br />
            tracked <em>live</em>.
          </h1>
          <p className={styles.heroSub}>
            News, research, capital, and policy — stitched together by editors,
            watched continuously across 17 public sources.
          </p>
          <div className={styles.heroMeta}>
            <div><strong>17</strong>public sources</div>
            <div><strong>9</strong>leading indicators</div>
            <div><strong>12h</strong>refresh cadence</div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>The lead <em>signal</em>.</h2>
            <small>Curated · {stories.length || 0} stories on the wire</small>
          </div>

          <div className={styles.lead}>
            <article className={styles.leadCard}>
              {lead ? (
                <>
                  <p className={styles.leadEyebrow}>
                    Lead briefing
                    <span>· {lead.category}</span>
                    <span>· {lead.region}</span>
                    {lead.sourceName && <span>· {lead.sourceName}</span>}
                  </p>
                  <h3 className={styles.leadHeadline}>{lead.headline}</h3>
                  <p className={styles.leadBody}>
                    {lead.aiSummary || lead.summary || "Briefing in progress."}
                  </p>
                  <div className={styles.leadMeta}>
                    <span>{relativeTime(lead.publishedAt)}</span>
                    {lead.sourceUrl && (
                      <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">
                        Read primary source →
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.skeleton} style={{ height: 240 }} />
              )}
            </article>

            <div>
              <p className={styles.sideHead}>Also moving</p>
              <div className={styles.sideStories}>
                {next3.length
                  ? next3.map((s) => (
                      <div key={s.id} className={styles.sideStory}>
                        {s.sourceUrl ? (
                          <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <span className={styles.tag}>{s.category}</span>
                            <h5>{s.headline}</h5>
                            <time>{relativeTime(s.publishedAt)}</time>
                          </a>
                        ) : (
                          <>
                            <span className={styles.tag}>{s.category}</span>
                            <h5>{s.headline}</h5>
                            <time>{relativeTime(s.publishedAt)}</time>
                          </>
                        )}
                      </div>
                    ))
                  : Array.from({ length: 3 }).map((_, i) => (
                      <div key={`s-${i}`} className={styles.sideStory}>
                        <div className={styles.skeleton} style={{ height: 60 }} />
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>The <em>numbers</em>, today.</h2>
            <small>Statistics Canada · Bank of Canada · Markets</small>
          </div>

          <div className={styles.indicators}>
            {indicators4.length
              ? indicators4.map((ind) => {
                  const last = ind.data[ind.data.length - 1]
                  const prev = ind.data[ind.data.length - 2]
                  const delta = last && prev ? last.value - prev.value : null
                  return (
                    <div key={ind.id} className={styles.indicator}>
                      <span className={styles.indGlow} />
                      <p className={styles.indLabel}>{ind.title}</p>
                      {last ? (
                        <div className={styles.indValue}>
                          {last.value.toLocaleString("en-CA", { maximumFractionDigits: 2 })}
                          <small>{ind.unit}</small>
                        </div>
                      ) : (
                        <div className={styles.skeleton} style={{ marginTop: 16 }} />
                      )}
                      {delta !== null && (
                        <div className={`${styles.indDelta} ${delta >= 0 ? styles.up : styles.down}`}>
                          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)} {ind.unit} vs. prior
                        </div>
                      )}
                      <p className={styles.indDesc}>{ind.description}</p>
                    </div>
                  )
                })
              : Array.from({ length: 4 }).map((_, i) => (
                  <div key={`i-${i}`} className={styles.indicator}>
                    <div className={styles.skeleton} />
                  </div>
                ))}
          </div>
        </section>

        <footer className={styles.proto}>
          <span>Prototype · Direction C · Northern Atmospheric</span>
          <Link href="/design">← Back to all directions</Link>
        </footer>
      </div>
    </div>
  )
}
