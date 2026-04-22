"use client"

import Link from "next/link"
import { Archivo_Black, Archivo, JetBrains_Mono, Fraunces } from "next/font/google"
import { usePolling } from "@/hooks/usePolling"
import { relativeTime } from "@/lib/relative-time"
import type { Story } from "@/lib/mock-data"
import type { Indicator } from "@/lib/indicators-data"
import styles from "./sovereign.module.css"

const display = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-sov-display",
})
const displayItalic = Fraunces({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  display: "swap",
  variable: "--font-sov-display-italic",
})
const body = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sov-body",
})
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-sov-mono",
})

interface StoriesPayload { stories: Story[] }

const transformStories = (j: Record<string, unknown>): StoriesPayload =>
  ({ stories: (j.stories as Story[] | undefined) ?? [] })

const transformIndicators = (j: Record<string, unknown>): Indicator[] | null =>
  Array.isArray(j) ? (j as Indicator[]) : null

function nowStamp(): string {
  const d = new Date()
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC"
}

function formatDataDate(raw: string | undefined): string {
  if (!raw) return "—"
  // Accepts "YYYY-MM" or "YYYY-MM-DD"; returns "MMM YYYY" or "D MMM YYYY"
  const parts = raw.split("-")
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
  if (parts.length === 2) {
    const [y, m] = parts
    const idx = parseInt(m, 10) - 1
    return `${months[idx] ?? m} ${y}`
  }
  if (parts.length === 3) {
    const [y, m, d] = parts
    const idx = parseInt(m, 10) - 1
    return `${parseInt(d, 10)} ${months[idx] ?? m} ${y}`
  }
  return raw.toUpperCase()
}

export default function SovereignPage() {
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
  const next5 = stories.filter((s) => s.id !== lead?.id).slice(0, 3)
  const indicators4 = (indicators ?? []).slice(0, 4)

  const tickerItems = indicators4.length
    ? indicators4.map((ind) => {
        const last = ind.data[ind.data.length - 1]
        const prev = ind.data[ind.data.length - 2]
        const delta = last && prev ? last.value - prev.value : 0
        return {
          label: ind.title.toUpperCase(),
          value: last ? `${last.value.toFixed(ind.unit === "%" ? 1 : 2)}${ind.unit}` : "—",
          delta,
        }
      })
    : []

  return (
    <div className={`${display.variable} ${displayItalic.variable} ${body.variable} ${mono.variable} ${styles.page}`}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <span className={styles.brand}>AI CANADA PULSE · LIVE INDEX</span>
          <nav className={styles.nav}>
            <a href="/">Digest</a>
            <a href="/dashboard" className={styles.active}>Dashboard</a>
            <a href="/topics">Topics</a>
            <a href="/blog">Deep Dives</a>
            <a href="/datacentres">Data Centres</a>
            <a href="/methodology">Methodology</a>
          </nav>
          <span className={styles.right}>
            <span><span className={styles.statusDot} />SYSTEMS NOMINAL</span>
            <span>{nowStamp()}</span>
          </span>
        </header>

        <section className={styles.hero}>
          <p className={styles.eyebrow}>
            <span>VOL III · ISSUE 042 · PUBLIC INTELLIGENCE</span>
            <span>LIVE</span>
          </p>
          <h1 className={styles.heroTitle}>
            AI Activity in Canada,<br />
            <span className={styles.alt}>measured</span> <span className={styles.ital}>hourly.</span>
          </h1>
          <p className={styles.heroSub}>
            <strong>17 public sources.</strong> 9 leading indicators. Stitched, summarized,
            and refreshed every 12 hours by editors — for the policymakers, researchers,
            and operators who need ground truth, not vibes.
          </p>

          <div className={styles.ticker}>
            <span className={styles.tickerLabel}>LIVE INDEX</span>
            <div className={styles.tickerScroll}>
              <div className={styles.tickerInner}>
                {(tickerItems.length ? [...tickerItems, ...tickerItems, ...tickerItems] : Array.from({ length: 9 }).map((_, i) => ({ label: `LOADING ${i+1}`, value: "—", delta: 0 })))
                  .map((t, i) => (
                    <span key={i} className={styles.tickerItem}>
                      {t.label} <b>{t.value}</b> <em>{t.delta >= 0 ? "▲" : "▼"} {Math.abs(t.delta).toFixed(2)}</em>
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.num}>§ 01</span>
            <h2>Lead Signal</h2>
            <span className={styles.meta}>Curated · {stories.length || 0} signals total</span>
          </div>

          <div className={styles.lead}>
            <article className={styles.leadCard}>
              {lead ? (
                <>
                  <p className={styles.leadMeta}>
                    <span>{lead.category.toUpperCase()}</span>
                    <span>{lead.region.toUpperCase()}</span>
                    {lead.sourceName && <span>{lead.sourceName.toUpperCase()}</span>}
                  </p>
                  <h3 className={styles.leadHeadline}>{lead.headline}</h3>
                  <p className={styles.leadBody}>
                    {lead.aiSummary || lead.summary || "Briefing in progress."}
                  </p>
                  <div className={styles.leadFoot}>
                    <span>{relativeTime(lead.publishedAt).toUpperCase()}</span>
                    {lead.sourceUrl && (
                      <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">
                        ► PRIMARY SOURCE
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.skeleton} style={{ height: 200 }} />
              )}
            </article>

            <div>
              <div className={styles.signalsHead}>ALSO MOVING</div>
              <div className={styles.signals}>
                {next5.length
                  ? next5.map((s) => {
                      const summary = s.aiSummary || s.summary
                      const content = (
                        <>
                          <span className={styles.tag}>{s.category}{s.aiSummary ? " · AI" : ""}</span>
                          <h5>{s.headline}</h5>
                          {summary && <p className={styles.signalSummary}>{summary}</p>}
                          <time>{relativeTime(s.publishedAt).toUpperCase()}{s.sourceName ? ` · ${s.sourceName.toUpperCase()}` : ""}</time>
                        </>
                      )
                      return (
                        <div key={s.id} className={styles.signalRow}>
                          {s.sourceUrl
                            ? <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{content}</a>
                            : content}
                        </div>
                      )
                    })
                  : Array.from({ length: 3 }).map((_, i) => (
                      <div key={`s-${i}`} className={styles.signalRow}>
                        <div className={styles.skeleton} style={{ height: 40 }} />
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.num}>§ 02</span>
            <h2>Leading Indicators</h2>
            <span className={styles.meta}>Statistics Canada · BoC · Markets</span>
          </div>

          <div className={styles.indicatorGrid}>
            {indicators4.length
              ? indicators4.map((ind) => {
                  const last = ind.data[ind.data.length - 1]
                  const prev = ind.data[ind.data.length - 2]
                  const delta = last && prev ? last.value - prev.value : null
                  return (
                    <div key={ind.id} className={styles.indicator}>
                      <div>
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
                            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)} {ind.unit}
                          </div>
                        )}
                      </div>
                      <div className={styles.indSrc}>
                        {last?.date && <><span className={styles.indDate}>AS OF {formatDataDate(last.date)}</span><br /></>}
                        SRC · {ind.sourceLabel.split(",")[0]}
                      </div>
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
          <span>PROTOTYPE · DIRECTION B · SOVEREIGN DATA</span>
          <Link href="/design">← BACK TO ALL DIRECTIONS</Link>
        </footer>
      </div>
    </div>
  )
}
