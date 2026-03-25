# Dashboard Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken GDELT sentiment data, upgrade Next.js to v15, add route-level error/loading UI, and convert 3 static sections to Server Components to eliminate 3 of the 13 client-side fetch waterfalls.

**Architecture:** The dashboard is a Next.js App Router app where all components currently run as `"use client"` and fire independent `useEffect` fetches. We're going to (a) upgrade the framework for React 19 compatibility, (b) fix the real data bug in the sentiment route, (c) add App Router's built-in loading/error files, and (d) flip the 3 fully static sections (Research, GovRegistry, Parliament) to Server Components that receive pre-fetched data as props from the async dashboard page.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, App Router

---

## File Map

| Action | File |
|--------|------|
| Modify | `frontend/package.json` — bump next to 15 |
| Modify | `frontend/src/app/api/v1/sentiment/route.ts` — extract real tone from `urltone` field |
| Create | `frontend/src/app/dashboard/loading.tsx` — skeleton loading UI |
| Create | `frontend/src/app/dashboard/error.tsx` — route-level error boundary |
| Modify | `frontend/src/app/dashboard/page.tsx` — make async, parallel-fetch static sections, pass as props |
| Modify | `frontend/src/components/ResearchSection.tsx` — remove "use client", accept data prop |
| Modify | `frontend/src/components/GovRegistrySection.tsx` — remove "use client", accept data prop |
| Modify | `frontend/src/components/ParliamentSection.tsx` — remove "use client", accept data prop |

---

## Task 1: Upgrade Next.js to v15

**Files:**
- Modify: `frontend/package.json`

Next.js 14 + React 19 is an unsupported combination. Next 15 adds first-class React 19 support.

- [ ] **Step 1: Update package.json**

Change `"next": "14.2.18"` → `"next": "15"`:

```json
"dependencies": {
  "clsx": "^2.1.1",
  "echarts": "^5.5.1",
  "echarts-for-react": "^3.0.2",
  "google-trends-api": "^4.9.2",
  "next": "15",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "rss-parser": "^3.13.0"
}
```

- [ ] **Step 2: Install and verify the build**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm install --legacy-peer-deps && npm run build
```

Expected: build succeeds. If you see warnings about async `cookies()` or `headers()` or `params`, those are in the API routes — check each one.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && git add package.json package-lock.json
git commit -m "chore: upgrade Next.js 14 → 15 for React 19 compatibility"
```

---

## Task 2: Fix GDELT Sentiment (real tone extraction)

**Files:**
- Modify: `frontend/src/app/api/v1/sentiment/route.ts`

**The bug:** GDELT's `ArtList` response includes a `urltone` field (a float like `-2.34`) per article. The current code hardcodes `tone: 0` for every article and always returns `sentimentLabel: "neutral"` and `toneDistribution: { positive: 0, neutral: total, negative: 0 }`. The HeroSection "Sector Mood" badge is therefore always absent/neutral — the entire pulse feature is broken.

**The fix:** Parse `urltone` from each raw article, compute `averageTone`, derive `sentimentLabel` (positive if avg > 1, negative if avg < -1, else neutral), and compute a real tone distribution.

- [ ] **Step 1: Update the sentiment route**

Replace `frontend/src/app/api/v1/sentiment/route.ts` with:

```typescript
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const params = new URLSearchParams({
      query: '("artificial intelligence" OR "machine learning") sourcecountry:CA',
      mode: "ArtList",
      maxrecords: "50",
      format: "json",
      sort: "DateDesc",
    })

    const url = `https://api.gdeltproject.org/api/v2/doc/doc?${params}`
    const res = await fetch(url, {
      headers: { "User-Agent": "AICanadaPulse/1.0" },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ data: null })
    }

    const text = await res.text()
    if (!text.startsWith("{") && !text.startsWith("[")) {
      return NextResponse.json({ data: null })
    }

    const json = JSON.parse(text)
    const rawArticles = json.articles ?? []

    interface RawArticle {
      url?: string
      title?: string
      source?: string
      domain?: string
      language?: string
      seendate?: string
      socialimage?: string
      urltone?: string | number
    }

    const articles = rawArticles.map((a: RawArticle) => ({
      url: a.url || "",
      title: a.title || "Untitled",
      source: a.source || "",
      domain: a.domain || "",
      language: a.language || "English",
      seenDate: formatGdeltDate(a.seendate || ""),
      tone: parseFloat(String(a.urltone ?? "0")) || 0,
      socialImage: a.socialimage || null,
    }))

    // Compute real sentiment metrics
    const tones = articles.map((a: { tone: number }) => a.tone)
    const averageTone = tones.length > 0
      ? tones.reduce((s: number, t: number) => s + t, 0) / tones.length
      : 0

    const sentimentLabel: "positive" | "neutral" | "negative" =
      averageTone > 1 ? "positive" : averageTone < -1 ? "negative" : "neutral"

    const toneDistribution = {
      positive: tones.filter((t: number) => t > 1).length,
      neutral: tones.filter((t: number) => t >= -1 && t <= 1).length,
      negative: tones.filter((t: number) => t < -1).length,
    }

    const data = {
      articles: articles.slice(0, 20),
      averageTone: Math.round(averageTone * 100) / 100,
      sentimentLabel,
      toneDistribution,
      topSources: getTopSources(articles),
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, max-age=10800, stale-while-revalidate=3600",
        },
      }
    )
  } catch {
    return NextResponse.json({ data: null })
  }
}

function formatGdeltDate(raw: string): string {
  if (raw.length >= 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return raw
}

function getTopSources(
  articles: Array<{ domain: string; source: string }>
): Array<{ source: string; count: number }> {
  const counts: Record<string, number> = {}
  for (const a of articles) {
    const src = a.domain || a.source
    counts[src] = (counts[src] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([source, count]) => ({ source, count }))
}
```

- [ ] **Step 2: Verify the fix manually**

Start the dev server and hit the endpoint:

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run dev
```

In another terminal:
```bash
curl http://localhost:3001/api/v1/sentiment | python -m json.tool | grep -E "averageTone|sentimentLabel|toneDistribution"
```

Expected: `averageTone` is a non-zero float, `sentimentLabel` is one of `"positive"/"neutral"/"negative"`, and `toneDistribution` has non-zero values spread across the three buckets.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/api/v1/sentiment/route.ts
git commit -m "fix: extract real GDELT urltone field for sentiment analysis

Previously all articles had tone: 0 hardcoded, making the HeroSection
Sector Mood badge always absent. Now parses urltone from GDELT response
and computes real averageTone, sentimentLabel, and toneDistribution."
```

---

## Task 3: Add dashboard loading.tsx and error.tsx

**Files:**
- Create: `frontend/src/app/dashboard/loading.tsx`
- Create: `frontend/src/app/dashboard/error.tsx`

App Router uses `loading.tsx` as a Suspense boundary wrapper and `error.tsx` as an error boundary for the route segment. Right now an uncaught error in any section causes a blank white screen.

- [ ] **Step 1: Create loading.tsx**

```typescript
// frontend/src/app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-blue-400 animate-spin" />
        <p className="text-xs text-slate-500 uppercase tracking-widest">Loading</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create error.tsx**

Note: `error.tsx` must be a Client Component (the `"use client"` directive is required by Next.js for error boundaries).

```typescript
// frontend/src/app/dashboard/error.tsx
"use client"

import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-800/60 rounded border border-red-500/30 p-8 max-w-md text-center">
        <p className="text-sm font-medium text-red-400 mb-2">Dashboard failed to load</p>
        <p className="text-xs text-slate-500 mb-6">{error.message || "An unexpected error occurred."}</p>
        <button
          onClick={reset}
          className="text-xs text-blue-400 border border-blue-500/30 px-4 py-2 rounded hover:bg-blue-500/10 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify loading and error files work**

Visit `http://localhost:3001/dashboard` — page should load normally. To test error boundary, temporarily add `throw new Error("test")` at the top of `dashboard/page.tsx`, confirm the error UI shows, then remove it.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/dashboard/loading.tsx frontend/src/app/dashboard/error.tsx
git commit -m "feat: add route-level loading and error UI for dashboard"
```

---

## Task 4: Convert static sections to Server Components

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`
- Modify: `frontend/src/components/ResearchSection.tsx`
- Modify: `frontend/src/components/GovRegistrySection.tsx`
- Modify: `frontend/src/components/ParliamentSection.tsx`

**Goal:** ResearchSection, GovRegistrySection, and ParliamentSection have zero interactivity — they just display data. By removing `"use client"` and accepting data as props from the async Server Component dashboard page, we eliminate 3 client-side fetch waterfalls. The initial HTML will include the rendered content (no loading spinners for these sections). The API routes are kept intact for external consumers.

**Pattern:**
1. Dashboard `page.tsx` becomes `async`, calls all 3 API routes in parallel via `Promise.all()`
2. Data is passed as props to each section component
3. Section components drop `"use client"`, `useState`, and `useEffect` — they become pure render functions
4. The chart sections (IndicatorsSection, TrendsSection, SentimentSection, etc.) are unchanged — they require client rendering

**Important:** When fetching from API routes within a Server Component, use `fetch()` with the full URL (or call the lib client directly). The simplest approach is to call the API routes using absolute URLs or to import the lib clients directly. We'll use `fetch()` with absolute URL construction since the lib clients have in-memory caches that reset per cold start.

### 4a: Update ResearchSection

- [ ] **Step 1: Rewrite ResearchSection to accept props**

Replace `frontend/src/components/ResearchSection.tsx` with:

```typescript
import type { ResearchPaper } from "@/lib/research-client"

interface Props {
  papers: ResearchPaper[]
}

export default function ResearchSection({ papers }: Props) {
  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Canadian AI Research
      </h2>

      {papers.length === 0 && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Unable to load research data at this time.</p>
        </div>
      )}

      {papers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {papers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}

      {papers.length > 0 && (
        <p className="text-[10px] text-slate-600 mt-2">
          Source: OpenAlex — open research database. Showing most-cited Canadian AI papers since 2024.
        </p>
      )}
    </section>
  )
}

function PaperCard({ paper }: { paper: ResearchPaper }) {
  const link = paper.openAccessUrl || paper.doiUrl

  return (
    <article className="bg-slate-800/60 rounded border border-slate-700/50 p-4 flex flex-col gap-2 card-hover">
      <h3 className="text-sm font-semibold text-slate-200 leading-snug line-clamp-3">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            {paper.title}
          </a>
        ) : (
          paper.title
        )}
      </h3>

      <p className="text-xs text-slate-500 line-clamp-1">
        {paper.authors.join(", ")}
        {paper.authors.length >= 5 && " et al."}
      </p>

      {paper.institutions.length > 0 && (
        <p className="text-xs text-slate-400">
          {paper.institutions.join(" / ")}
        </p>
      )}

      {paper.concepts.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {paper.concepts.map((c) => (
            <span
              key={c}
              className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-auto pt-1 text-xs">
        {paper.journal && (
          <span className="text-slate-500 truncate">{paper.journal}</span>
        )}
        <span className="text-slate-500 ml-auto whitespace-nowrap">
          {paper.citationCount} citations
        </span>
        {paper.publicationDate && (
          <span className="text-slate-600 whitespace-nowrap">
            {paper.publicationDate.slice(0, 7)}
          </span>
        )}
      </div>
    </article>
  )
}
```

### 4b: Update GovRegistrySection

- [ ] **Step 2: Rewrite GovRegistrySection to accept props**

Replace `frontend/src/components/GovRegistrySection.tsx` with:

```typescript
import type { GovAISystem } from "@/lib/gov-ai-registry-client"

const RISK_COLORS: Record<string, string> = {
  High: "text-red-400 bg-red-500/10 border-red-500/20",
  Moderate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Minimal: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Unclassified: "text-slate-400 bg-slate-500/10 border-slate-500/20",
}

interface Props {
  systems: GovAISystem[]
}

export default function GovRegistrySection({ systems }: Props) {
  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Federal AI Systems Registry
      </h2>

      {systems.length === 0 && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Unable to load government AI registry data at this time.</p>
        </div>
      )}

      {systems.length > 0 && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-4">
            <span className="text-sm font-medium text-slate-200">
              {systems.length} AI system{systems.length !== 1 ? "s" : ""} tracked
            </span>
            <RiskSummary systems={systems} />
          </div>

          <div className="divide-y divide-slate-700/30 max-h-[400px] overflow-y-auto">
            {systems.map((sys) => (
              <div key={sys.id} className="px-4 py-3 hover:bg-slate-700/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-200 leading-snug">
                      {sys.url ? (
                        <a
                          href={sys.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-400 transition-colors"
                        >
                          {sys.title}
                        </a>
                      ) : (
                        sys.title
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{sys.department}</p>
                    {sys.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sys.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${RISK_COLORS[sys.riskLevel] || RISK_COLORS.Unclassified}`}
                  >
                    {sys.riskLevel}
                  </span>
                </div>
                {sys.datePublished && (
                  <p className="text-[10px] text-slate-600 mt-1">{sys.datePublished}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {systems.length > 0 && (
        <p className="text-[10px] text-slate-600 mt-2">
          Source: Open Canada (CKAN) — Treasury Board Algorithmic Impact Assessments
        </p>
      )}
    </section>
  )
}

function RiskSummary({ systems }: { systems: GovAISystem[] }) {
  const counts: Record<string, number> = {}
  for (const s of systems) counts[s.riskLevel] = (counts[s.riskLevel] || 0) + 1

  return (
    <div className="flex items-center gap-2">
      {Object.entries(counts).map(([level, count]) => (
        <span
          key={level}
          className={`text-[10px] px-1.5 py-0.5 rounded border ${RISK_COLORS[level] || RISK_COLORS.Unclassified}`}
        >
          {count} {level}
        </span>
      ))}
    </div>
  )
}
```

### 4c: Update ParliamentSection

- [ ] **Step 3: Rewrite ParliamentSection to accept props**

Replace `frontend/src/components/ParliamentSection.tsx` with:

```typescript
import type { ParliamentMention, ParliamentData } from "@/lib/parliament-client"

const PARTY_COLORS: Record<string, string> = {
  Liberal: "text-red-400",
  Conservative: "text-blue-400",
  NDP: "text-orange-400",
  "Bloc Québécois": "text-cyan-400",
  Green: "text-green-400",
}

interface Props {
  data: ParliamentData | null
}

export default function ParliamentSection({ data }: Props) {
  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        AI in Parliament
      </h2>

      {(!data || data.mentions.length === 0) && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 p-6">
          <p className="text-sm text-slate-500">Unable to load parliamentary data at this time.</p>
        </div>
      )}

      {data && data.mentions.length > 0 && (
        <div className="bg-slate-800/60 rounded border border-slate-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50">
            <span className="text-sm font-medium text-slate-200">
              Recent AI-related debates in the House of Commons
            </span>
          </div>

          <div className="divide-y divide-slate-700/30 max-h-[360px] overflow-y-auto">
            {data.mentions.map((m, i) => (
              <MentionRow key={`${m.url}-${i}`} mention={m} />
            ))}
          </div>
        </div>
      )}

      {data && data.mentions.length > 0 && (
        <p className="text-[10px] text-slate-600 mt-2">
          Source: OpenParliament.ca — tracking mentions of AI, AIDA, and machine learning
        </p>
      )}
    </section>
  )
}

function MentionRow({ mention }: { mention: ParliamentMention }) {
  return (
    <div className="px-4 py-3 hover:bg-slate-700/20 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-slate-200">{mention.speaker}</span>
        {mention.party && (
          <span className={`text-[10px] ${PARTY_COLORS[mention.party] || "text-slate-400"}`}>
            {mention.party}
          </span>
        )}
        <span className="text-[10px] text-slate-600 ml-auto">{mention.date}</span>
      </div>

      {mention.excerpt && (
        <p className="text-xs text-slate-400 line-clamp-2">{mention.excerpt}</p>
      )}

      <a
        href={mention.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-blue-400/70 hover:text-blue-400 mt-1 inline-block"
      >
        Read full statement
      </a>
    </div>
  )
}
```

### 4d: Update dashboard page to fetch server-side

- [ ] **Step 4: Make dashboard/page.tsx async and parallel-fetch static sections**

Replace `frontend/src/app/dashboard/page.tsx` with:

```typescript
import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"
import BriefingCard from "@/components/BriefingCard"
import IndicatorsSection from "@/components/IndicatorsSection"
import TrendsSection from "@/components/TrendsSection"
import StoryFeed from "@/components/StoryFeed"
import AdoptionComparison from "@/components/AdoptionComparison"
import ResearchSection from "@/components/ResearchSection"
import GovRegistrySection from "@/components/GovRegistrySection"
import ParliamentSection from "@/components/ParliamentSection"
import JobMarketSection from "@/components/JobMarketSection"
import SentimentSection from "@/components/SentimentSection"
import StocksSection from "@/components/StocksSection"
import type { ResearchPaper } from "@/lib/research-client"
import type { GovAISystem } from "@/lib/gov-ai-registry-client"
import type { ParliamentData } from "@/lib/parliament-client"

// These three sections have no interactivity — fetch server-side
// so the initial HTML includes the data (no loading spinner flash).
async function fetchStaticData() {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3001"

  const [researchRes, govRes, parliamentRes] = await Promise.allSettled([
    fetch(`${base}/api/v1/research`, { next: { revalidate: 21600 } }),
    fetch(`${base}/api/v1/gov-registry`, { next: { revalidate: 43200 } }),
    fetch(`${base}/api/v1/parliament`, { next: { revalidate: 21600 } }),
  ])

  const papers: ResearchPaper[] =
    researchRes.status === "fulfilled" && researchRes.value.ok
      ? ((await researchRes.value.json()).papers ?? [])
      : []

  const systems: GovAISystem[] =
    govRes.status === "fulfilled" && govRes.value.ok
      ? ((await govRes.value.json()).systems ?? [])
      : []

  const parliamentData: ParliamentData | null =
    parliamentRes.status === "fulfilled" && parliamentRes.value.ok
      ? ((await parliamentRes.value.json()).data ?? null)
      : null

  return { papers, systems, parliamentData }
}

export default async function DashboardPage() {
  const { papers, systems, parliamentData } = await fetchStaticData()

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Hero — full width */}
        <HeroSection />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT: Stories + Research + Policy */}
          <div className="flex flex-col gap-8">
            {/* Top Story */}
            <BriefingCard />

            {/* Stories Feed */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
                Latest Stories
              </h2>
              <StoryFeed />
            </section>

            {/* Canadian AI Research — server-rendered */}
            <ResearchSection papers={papers} />

            {/* Federal AI Systems Registry — server-rendered */}
            <GovRegistrySection systems={systems} />

            {/* AI in Parliament — server-rendered */}
            <ParliamentSection data={parliamentData} />
          </div>

          {/* RIGHT: Economic Indicators + Visuals + Market */}
          <div className="flex flex-col gap-8">
            <IndicatorsSection />
            <TrendsSection />
            <SentimentSection />
            <AdoptionComparison />
            <StocksSection />
            <JobMarketSection />
          </div>

        </div>
      </main>

      <footer className="text-center text-xs text-slate-600 py-8 border-t border-slate-800">
        AI Canada Pulse — tracking artificial intelligence across Canada
      </footer>
    </div>
  )
}
```

- [ ] **Step 5: Run build to verify no TypeScript errors**

```bash
cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build
```

Expected: build succeeds, no type errors.

- [ ] **Step 6: Smoke test in dev**

```bash
npm run dev
```

Visit `http://localhost:3001/dashboard`. Verify:
- Research, GovRegistry, Parliament sections render immediately (no loading spinner)
- HeroSection, BriefingCard, StoryFeed, chart sections still show loading then data
- No console errors

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/dashboard/page.tsx \
        frontend/src/components/ResearchSection.tsx \
        frontend/src/components/GovRegistrySection.tsx \
        frontend/src/components/ParliamentSection.tsx
git commit -m "perf: convert Research, GovRegistry, Parliament to Server Components

These three sections have no interactivity. They now receive pre-fetched
data as props from the async dashboard page, eliminating 3 client-side
fetch waterfalls and rendering their content in the initial HTML."
```

---

## Verification Checklist

After all 4 tasks are complete:

- [ ] `npm run build` passes with no errors
- [ ] `/dashboard` loads and shows content for Research, GovRegistry, Parliament without loading spinners
- [ ] `/api/v1/sentiment` returns a non-zero `averageTone` and real `toneDistribution`
- [ ] HeroSection "Sector Mood" badge appears (it was hidden because `pulse.mood` was always absent/neutral)
- [ ] Deliberately throw an error in `dashboard/page.tsx` — verify `error.tsx` UI appears
- [ ] Check browser DevTools Network tab: Research, GovRegistry, Parliament sections no longer fire fetch requests from the client
