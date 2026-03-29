# Digest Homepage & AI Blog — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Author:** Brainstorming session

---

## Problem Statement

The current dashboard is overwhelming for daily visitors — 18 panels of dense text and data compete for attention simultaneously. The site lacks a primary "what happened today" narrative, forcing users to synthesize signals themselves. There is no blog or long-form analysis capability.

**User need:** A quick daily scan experience (2–3 minutes) that answers "what do I need to know about Canadian AI right now?" with optional depth for those who want more.

---

## Goals

1. Replace the overwhelming dashboard-first experience with a clean daily digest homepage
2. Add auto-generated deep-dive blog posts triggered by significant stories
3. Streamline the dashboard from 18 open panels to 6 always-visible + 4 collapsible
4. Keep all changes within the existing tech stack (Next.js 14, Upstash Redis, gpt-4o-mini, existing cron)

## Non-Goals

- Manual blog post authoring (no CMS, no admin UI)
- Comments or user interaction on posts
- Email newsletter delivery
- Authentication or paywalling

---

## Section 1 — Daily Digest Homepage

### Route
`/` — replaces the current redirect to `/dashboard`

### Content Structure
```
Date label + "Today in Canadian AI" heading
2–3 sentence AI-written intro paragraph (sets narrative tone for the day)
Key Developments (3–5 bullet points, 1–2 sentences each)
Topic tags (Policy / Research / Talent / Markets / Regulation — whichever apply)
Top Stories (3 headline links only, no summaries, linking to external sources)
Deep Dive callout (appears only when a deep-dive was auto-generated for the day)
Archive navigation (← Yesterday / Tomorrow →)
"Explore Dashboard →" link
```

### Design Principles
- Clean editorial layout matching existing site aesthetic (Manrope + Fraunces fonts, CSS custom variables)
- No dense walls of text — the intro is the longest prose block, capped at 3 sentences
- Top Stories are headline-only links — no summaries, no AI padding
- The Deep Dive callout is a subtle highlighted block, not a banner

### Archive
Past digests accessible at `/digest/[date]` (ISO format: `2026-03-27`). The archive nav on the homepage links to yesterday's edition. A full archive listing is available at `/blog`.

---

## Section 2 — Deep Dive Blog Posts

### Route
`/blog/[slug]` — slugs are auto-generated from the story title + date (e.g. `cohere-series-d-2026-03-28`)

### Content Structure
```
Category tags
Title (auto-generated, punchy)
Metadata: reading time + "AI-generated" badge + date
Body: 400–600 words of analytical prose (not summary — draws implications)
Pull quote / callout box for the key "why this matters" point
Sources list (links to original news items used as input)
Transparency note: explains why this story triggered a deep-dive
```

### Tone
Analytical, not journalistic. The post should explain *implications* for Canadian AI, not recap facts already in the news. Comparable to a thoughtful newsletter column, not a press release summary.

### Significance Thresholds (auto-trigger criteria)
A deep-dive is generated when any of the following are detected in the day's RSS/signals:
- Canadian AI funding round ≥ $50M mentioned in ≥ 2 sources
- New federal bill introduced with AI in the title or summary
- A Parliament vote on AI-related legislation
- An arXiv paper from a Canadian institution with unusually high engagement signals
- A story appearing across all 3 RSS sources simultaneously (Google News + BetaKit + CBC)

At most **one deep-dive per day** is generated. If multiple thresholds are crossed, the highest-signal story wins. This keeps the site from feeling like a spam bot.

### Archive
`/blog` lists all deep-dives and past digest editions in reverse chronological order, filterable by tag.

---

## Section 3 — Streamlined Dashboard

### Always Visible (6 panels)
| Panel | Why kept |
|---|---|
| Story Feed | Primary live signal — news is the heartbeat |
| Pulse Indicators | At-a-glance KPI numbers — fast to scan |
| Market Performance | Stock prices change daily — high recency value |
| Parliament Activity | Policy tracking — changes frequently |
| Media Sentiment | Tone indicator — complements story feed |
| Labour Demand | Job market — changes weekly |

### Collapsed by Default (4 panels — click to expand)
| Panel | Why collapsed |
|---|---|
| Research & Open Source | Changes weekly, not daily |
| AI Adoption Trends | Slower-moving signal |
| Ecosystem & Startups | Curated static data — low daily value |
| Regulatory & Global Standing | Policy changes infrequently |

### Removed Entirely
| Panel | Reason |
|---|---|
| Executive Brief | Replaced by digest homepage |
| Talent & Education | Static curated data — stays at `/provinces` |
| Province Index | Has dedicated `/provinces` pages |
| Compute Infrastructure | Rarely changes — not a daily signal |
| Lab Activity Feeds | Niche, low daily change |
| OECD Policy Tracker | Changes quarterly at best |
| Federal AI Registry | Static-ish, not a daily signal |
| AI Capability Tracker (EpochAI) | Slow-changing benchmark data |
| Canadian AI Models (HuggingFace) | Slow-changing model data |

### Visual Treatment for Collapsed Panels
Collapsed panels render as a single-line accordion row with the panel title and a `›` expand indicator. Clicking expands inline — no page navigation. State is not persisted (each visit starts with all collapsed panels closed).

---

## Section 4 — Technical Pipeline

### Generation Flow (extends existing cron)

The daily cron job at `/api/v1/ai-refresh` (runs 12:00 UTC) gains two new steps:

**Step 1 — Digest generation**
```
Input: Top 10 RSS stories (already fetched) + latest parliament/stocks/indicators data
Process: gpt-4o-mini prompt → structured JSON output
Output: { headline, intro, developments[], tags[], topStories[], generatedAt }
Storage: Redis key digest:YYYY-MM-DD (TTL: 90 days)
```

**Step 2 — Significance check + deep-dive generation (conditional)**
```
Input: Same top 10 RSS stories + significance threshold rules
Process: Rule-based check first (no LLM cost if no threshold crossed)
         → If triggered: gpt-4o-mini prompt with full story context
Output: { title, slug, body, tags[], sources[], triggeredBy, generatedAt }
Storage: Redis key deepdive:{slug} (no TTL — permanent)
         Redis sorted set deepdive:index (score = timestamp, member = slug)
```

### New API Routes
| Route | Method | Description |
|---|---|---|
| `/api/v1/digest` | GET | Today's digest (or `?date=YYYY-MM-DD` for archive) |
| `/api/v1/deep-dives` | GET | Paginated list of deep-dives (`?limit=10&cursor=`) |
| `/api/v1/deep-dives/[slug]` | GET | Single deep-dive post |

All routes use `unstable_cache` with 6h revalidation (matching existing pattern).

### New Pages
| Route | Component | Data source |
|---|---|---|
| `/` | `DigestPage` | `/api/v1/digest` |
| `/digest/[date]` | `DigestPage` | `/api/v1/digest?date=` |
| `/blog` | `BlogIndexPage` | `/api/v1/deep-dives` |
| `/blog/[slug]` | `DeepDivePage` | `/api/v1/deep-dives/[slug]` |

### New Library Files
| File | Purpose |
|---|---|
| `frontend/src/lib/digest-client.ts` | Generate and retrieve daily digests |
| `frontend/src/lib/deep-dive-client.ts` | Generate, detect, and retrieve deep-dives |

### Navigation Update
Header nav changes from:
> Dashboard · Provinces · Methodology

To:
> **Digest** · Dashboard · Deep Dives · Provinces · Methodology

"Digest" links to `/` and is the default active state on the homepage.

---

## Data Model

### Digest (Redis: `digest:YYYY-MM-DD`)
```typescript
interface DailyDigest {
  date: string                    // ISO date: "2026-03-28"
  headline: string                // 1 punchy sentence
  intro: string                   // 2-3 sentence narrative paragraph
  developments: {
    text: string                  // 1-2 sentence bullet
    tag: 'Policy' | 'Research' | 'Funding' | 'Markets' | 'Regulation' | 'Talent'
  }[]                             // 3-5 items
  tags: string[]                  // unique tags from developments
  topStories: {
    headline: string
    url: string
    source: string
  }[]                             // max 3
  deepDiveSlug?: string           // set if a deep-dive was generated today
  generatedAt: string             // ISO timestamp
}
```

### Deep Dive (Redis: `deepdive:{slug}`)
```typescript
interface DeepDive {
  slug: string
  title: string
  body: string                    // 400-600 words markdown
  tags: string[]
  sources: { headline: string; url: string; source: string }[]
  triggeredBy: string             // human-readable reason (e.g. "Funding round ≥ $50M: Cohere Series D")
  readingTimeMinutes: number      // computed from body length
  generatedAt: string             // ISO timestamp
  date: string                    // ISO date (for archive display)
}
```

---

## Error Handling & Fallbacks

- **Digest generation fails:** Show a "digest unavailable" placeholder with a link to `/dashboard`. Never show a blank page.
- **No stories today:** Digest still generates but developments section says "No significant Canadian AI developments detected today." (rare — RSS usually has content)
- **Deep-dive quality check:** After generation, a simple validation checks that the body is ≥ 300 words and contains ≥ 2 of the source headlines. If it fails, the deep-dive is discarded silently (today shows no Deep Dive callout).
- **Redis unavailable:** Digest page falls back to fetching stories directly and rendering a simplified view without AI prose.

---

## Scope Boundaries

**In scope:**
- Daily digest homepage and archive
- Auto-generated deep-dives with significance detection
- Dashboard panel reduction (6 visible, 4 collapsible, rest removed)
- Navigation update
- New API routes and library files

**Out of scope (future work):**
- RSS feed for digest/blog (could be added later)
- Social sharing metadata per deep-dive (basic OG tags only)
- Search across digest archive
- Deep-dive quality scoring / human review queue
