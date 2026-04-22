import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Design directions",
  description: "Three candidate visual directions for the AI Canada Pulse revamp.",
}

const directions = [
  {
    slug: "broadsheet",
    name: "Broadsheet",
    tag: "Editorial newspaper",
    pitch:
      "Ink-on-paper authority. Massive display serif, hairline rules, masthead with issue + folio, drop-cap lead. Confident and quiet.",
    palette: ["#f4ecd8", "#1a1a1a", "#C8102E"],
  },
  {
    slug: "sovereign",
    name: "Sovereign Data",
    tag: "Civic brutalist",
    pitch:
      "GOV.UK × Stats Canada × Bloomberg Terminal. Condensed geometric caps, monospace numbers, hard grid, sharp red and teal. Authoritative public-data product.",
    palette: ["#f7f7f5", "#0a0a0a", "#D52B1E", "#0d7c8f"],
  },
  {
    slug: "aurora",
    name: "Northern Atmospheric",
    tag: "Aurora — dark mode showcase",
    pitch:
      "Midnight navy with surgical aurora gradient (teal → magenta → amber) used only in the hero. Characterful display serif with italic emphasis. Distinctly Canadian without flag-waving.",
    palette: ["#0a1428", "#f5f0e6", "#3fb8af", "#c33c5c", "#e8a04d"],
  },
]

export default function DesignIndexPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c0c",
        color: "#f5f5f5",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "64px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#888",
            marginBottom: 16,
          }}
        >
          Internal · Design Exploration
        </p>
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            lineHeight: 1.05,
            fontWeight: 600,
            margin: 0,
            maxWidth: 820,
            letterSpacing: "-0.02em",
          }}
        >
          Three directions for the AI Canada Pulse revamp.
        </h1>
        <p
          style={{
            marginTop: 16,
            maxWidth: 680,
            fontSize: 16,
            lineHeight: 1.55,
            color: "#bcbcbc",
          }}
        >
          Each prototype renders the hero, lead briefing, four indicators, and three story
          cards using <strong style={{ color: "#fff" }}>live API data</strong>. Each is fully
          isolated — its own fonts, palette, and CSS module. Pick the one that should ship.
        </p>

        <div
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {directions.map((d) => (
            <Link
              key={d.slug}
              href={`/design/${d.slug}`}
              style={{
                display: "block",
                padding: 28,
                background: "#161616",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                textDecoration: "none",
                color: "inherit",
                transition: "border-color 0.15s, transform 0.15s",
              }}
            >
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {d.palette.map((c) => (
                  <span
                    key={c}
                    title={c}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: c,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                ))}
              </div>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#888",
                  margin: 0,
                }}
              >
                {d.tag}
              </p>
              <h2
                style={{
                  fontSize: 28,
                  margin: "8px 0 12px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                {d.name}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "#b0b0b0",
                  margin: 0,
                }}
              >
                {d.pitch}
              </p>
              <p
                style={{
                  marginTop: 24,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                View prototype →
              </p>
            </Link>
          ))}
        </div>

        <p style={{ marginTop: 64, fontSize: 12, color: "#666" }}>
          Note: each prototype ships in its primary mode (Broadsheet + Sovereign in light,
          Aurora in dark) to showcase the strongest expression of the direction. Light/dark
          parity will be built out for the chosen winner before global rollout.
        </p>
      </div>
    </div>
  )
}
