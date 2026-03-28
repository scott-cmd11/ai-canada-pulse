# Data Integrity Overhaul — Design Spec

**Date:** 2026-03-26
**Branch:** `feat/provincial-pages`
**Approach:** B — Data Integrity Overhaul

---

## 1. Goals & Principles

AI Canada Pulse aims to become the definitive, one-of-a-kind Canadian AI intelligence platform. Every claim must be verifiable. Every data point must link to its primary source.

**Core principles:**

- **Fact-driven:** No fabricated hub names, no invented descriptions, no unverifiable claims
- **Verifiable:** Every rendered item carries a link to its primary source
- **Transparent:** AI involvement is always labeled; methodology is auto-generated from the actual config
- **Honest about gaps:** Empty data is shown honestly, with national rollup clearly labeled

**Audience:** Two layers — (a) general public / curious Canadians wanting accessible, trustworthy AI coverage, and (b) researchers / academics who need citeable, rigorous data.

---

## 2. Source Registry

A central `source-registry.ts` formally declares every data stream the platform uses. Nothing renders without being traceable to this registry.

### Interface

```typescript
// frontend/src/lib/source-registry.ts

export interface DataSource {
  id: string                    // e.g. "arxiv", "openparliament"
  name: string                  // e.g. "arXiv.org"
  url: string                   // e.g. "https://arxiv.org"
  description: string           // What this source provides
  type: "news" | "research" | "government" | "jobs" | "market" | "trends" | "registry"
  refreshInterval: string       // e.g. "6h", "24h", "weekly"
  clientFile: string            // e.g. "rss-client.ts" — which lib file fetches this
  dataScope: "national" | "provincial" | "both"
  reliability: "primary" | "aggregated" | "community"
  fetchMethod: "rss" | "api" | "scrape" | "manual"
}

export const SOURCES: DataSource[] = [
  // ... every source declared here
]

export function getSourceById(id: string): DataSource | undefined
export function getSourcesByType(type: DataSource["type"]): DataSource[]
```

### Rules

- Every client library (`rss-client.ts`, `arxiv-client.ts`, etc.) must reference its `sourceId`
- Every API response includes `sourceName` and `sourceUrl` at the top level (section-level attribution)
- Every rendered item links back to its source
- The methodology page reads directly from `SOURCES` — no hand-written descriptions

---

## 3. Province Data Overhaul

Strip every fabricated claim from `provinces-config.ts`.

### What stays (verifiable facts)

- Province name, abbreviation, capital, population (StatCan data)
- The 3 Pan-Canadian AI Institutes with source URLs:
  - Vector Institute → `https://vectorinstitute.ai`
  - Mila → `https://mila.quebec`
  - Amii → `https://amii.ca`
- Universities with known CS/AI programs (verifiable from university websites)
- Company HQs where publicly verifiable (e.g., D-Wave in BC, Cohere in ON, Shopify in ON)

### What gets removed

- All fabricated `aiHub` names ("Saskatoon AgriTech Cluster", "Winnipeg Tech District", etc.)
- Editorial `description` blurbs containing unverifiable claims
- Any institution not linkable to a real URL

### Replacement

- `aiHub` field → removed from the `ProvinceConfig` interface entirely. **Migration prerequisite:** search all usages of `aiHub` (currently used in `ProvinceIndexSection.tsx`, `ProvincePreviewPanel.tsx`, and province page) and remove/replace before deleting from the interface.
- `description` → replaced with a factual one-liner: population rank, which (if any) of the 3 national AI institutes is located there, number of universities with AI programs
- `InstitutionConfig.url` → required (was optional). If you can't link it, it doesn't go on the site
- `InstitutionConfig.type` → rename `"lab"` to `"institute"` (migration: update all existing `type: "lab"` entries in provinces-config). Search all usages of `type === "lab"` before changing.

```typescript
export interface InstitutionConfig {
  name: string
  type: "institute" | "university" | "company"  // "lab" renamed to "institute"
  url: string                    // REQUIRED — verifiable link
}
```

**Note:** `sourceId` is NOT added to `InstitutionConfig`. Institutions are static config entries, not data streams. The `url` field provides verifiability — if you can link to it, it's verified.

### Provinces with no notable AI presence

- Page still exists (PEI, Northern Territories, etc.)
- Shows the university if it has a CS program
- Everything else comes from dynamic data (news, jobs, ArXiv)
- If no dynamic data → national rollup with clear labeling (see Section 6)

---

## 4. Citation Chain

Every rendered item must carry its primary source link.

| Data type | Source link target | Example |
|-----------|-------------------|---------|
| News story | Original article URL | `https://www.theglobeandmail.com/...` |
| ArXiv paper | ArXiv abstract page | `https://arxiv.org/abs/2403.12345` |
| Parliament mention | Hansard transcript | `https://openparliament.ca/debates/...` |
| Job listing | Original job posting | `https://indeed.com/viewjob?jk=...` |
| Stock data | Yahoo Finance ticker page | `https://finance.yahoo.com/quote/SHOP` |
| Google Trends | Google Trends explore page | `https://trends.google.com/trends/explore?geo=CA&q=...` |

### Implementation

- **Item-level:** Individual items (stories, papers, jobs) carry their own `link` or `url` field pointing to the original source. Most data types already have this (e.g., RSS stories have a `link` field). No new fields needed — use existing fields consistently.
- **Section-level:** Each dashboard section has a footer: `"Data from [Source Name →]"` linking to the source's top-level URL. The `<SourceAttribution sourceId="rss-news" />` component reads from the source registry.
- **API response shape:** Top-level API responses add `sourceName` and `sourceUrl` fields (e.g., `{ stories: [...], sourceName: "RSS News Feeds", sourceUrl: "..." }`). Individual items within the array keep their existing `link` field.

---

## 5. Expanded Canadian Data Sources

### Current sources (keep, add to registry)

| Source | Type | Verified URL |
|--------|------|-------------|
| RSS feeds (Globe & Mail, CBC, etc.) | News | Various, per-outlet |
| ArXiv | Research | `https://arxiv.org` |
| OpenParliament.ca | Government | `https://openparliament.ca` |
| Google Trends | Trends | `https://trends.google.com` |
| GitHub (trending) | Research | `https://github.com` |
| Indeed/job feeds | Jobs | Various job boards |
| Financial data (stocks) | Market | Yahoo Finance / similar |

### New sources (future phase, not implemented now)

| Source | Type | Verified URL |
|--------|------|-------------|
| ISED (Innovation Canada) | Government | `https://ised-isde.canada.ca` |
| CIFAR | Registry | `https://cifar.ca` |
| NSERC Awards DB | Research | `https://www.nserc-crsng.gc.ca` |
| The Logic | News | `https://thelogic.co` |
| BetaKit | News | `https://betakit.com` |
| Canada.ca AI Registry | Government | `https://canada.ca/ai` |
| CVCA | Market | `https://cvca.ca` |
| StatCan | Registry | `https://statcan.gc.ca` |

### What we don't add

- No social media scraping (Twitter/X, Reddit)
- No unverifiable blog aggregation
- No sources we can't link to directly

---

## 6. Methodology Page Auto-Generation

The `/methodology` page becomes auto-generated from the source registry.

### How it works

1. Page reads `SOURCES` from `source-registry.ts` at build time
2. Renders sources grouped by type (News, Research, Government, Jobs, Market, Trends, Registry)
3. For each source shows:
   - **Name** (linked to source URL)
   - **What it provides** (the `description` field)
   - **Refresh frequency** (e.g. "Every 6 hours")
   - **Data scope** (National / Provincial / Both)
   - **Fetch method** (Automated API, RSS feed, or Manual curation)
4. A separate "AI Processing" section explains:
   - Classification: how stories get tagged by province, category, sentiment
   - Summarization: when AI summaries are generated, how they're labeled
   - What models are used (with version numbers)
   - What the AI does NOT do (no editorial judgment, no source selection, no ranking manipulation)
5. A "Data Freshness" section shows last successful fetch timestamp per source

### What happens to existing methodology content

The current methodology page (~310 lines) has hand-written sections. Here's the disposition:

| Existing section | Action |
|-----------------|--------|
| Data sources listing | **Replaced** — auto-generated from `SOURCES` registry |
| AI generation and caching | **Rewritten** — becomes the "AI Processing" section with model versions |
| Cadence and reliability | **Replaced** — auto-generated as "Refresh frequency" per source |
| Data quality and limits | **Kept** — hand-written disclaimer about limitations stays as-is |
| Disclaimer | **Kept** — legal/editorial disclaimer stays as-is |

### Data Freshness implementation

The "Data Freshness" section shows last successful fetch timestamp per source. Implementation: each client library writes a `lastFetched` timestamp to Vercel KV (key: `source:${sourceId}:lastFetched`) on successful fetch. The methodology page reads these via a lightweight API route `/api/v1/source-status`. If KV is unavailable, the section shows "Timestamp unavailable" rather than failing.

### Dark mode

The current methodology page uses hardcoded Tailwind colors (`bg-white`, `text-slate-900`). The rewrite must migrate to CSS custom variables (`var(--bg-page)`, `var(--text-primary)`, etc.) to match the dashboard pattern. All new components (`ProvinceIndex`, `AILabel`, `SourceAttribution`) must also use CSS custom variables exclusively.

**Key principle:** If someone asks "where does this data come from?" — this page answers completely, and it's always accurate because it's generated from the same config the platform actually uses.

---

## 7. Province Page Behavior (Empty State → National Rollup)

### The rollup rule

For each data section (Stories, Jobs, Trends, Research, Parliament):

1. Fetch province-filtered data via the API (e.g., `?region=prince-edward-island`)
2. If results >= 1 → render normally with label: `"Prince Edward Island"`
3. If results === 0 → fetch national data (no region filter) and render with label:
   ```
   Showing national AI coverage
   No Prince Edward Island-specific stories found in the last 30 days.
   ```
4. The scope label is always visible — user always knows whether they're seeing provincial or national data

### Implementation

- Each section component gets a `fallbackToNational` prop (boolean, default true)
- `usePolling` hook gets new optional parameters and return fields:

```typescript
// Enhanced usePolling signature
function usePolling<T>(
  url: string,
  options: {
    interval?: number
    transform?: (data: unknown) => T
    fallbackUrl?: string           // URL to fetch if primary returns empty
    isEmpty?: (data: T) => boolean // Predicate to determine "empty" (default: Array.isArray(d) && d.length === 0)
  }
): {
  data: T | null
  loading: boolean
  lastUpdated: Date | null
  isFallback: boolean             // true when showing fallback data
}
```

- `isEmpty` is checked after every fetch (including subsequent poll cycles)
- When `isEmpty` returns true and `fallbackUrl` is set, the hook fetches from `fallbackUrl` instead and sets `isFallback: true`
- On subsequent poll cycles, the hook re-checks the primary URL first — if provincial data appears later, it switches back (`isFallback: false`)
- A `<ScopeLabel>` component reads `isFallback` and renders either "Provincial" or "National · No [Province]-specific data found" with appropriate styling

### Rules

- Never mix provincial and national data in the same list
- Never silently show national data as if it were provincial
- Never hide empty sections — absence of data is honest and informative

---

## 8. AI Labeling System

Every piece of AI-processed content is clearly labeled.

### Three levels

| Level | Label | When used |
|-------|-------|-----------|
| None | No label | Original headline, source link, raw data |
| Classification | `"AI-classified"` | Province tagging, category assignment, sentiment score |
| Summary | `"AI-generated summary"` | Paragraph-length summaries of articles |

### Visual treatment

- **Classification labels:** Small muted tag next to the classified value (e.g., `Sentiment: Positive` `AI-classified`)
- **Summary labels:** Header above summary text: `"AI-generated summary · Source: [Original Article →]"`
- Both use a consistent `<AILabel level="classification|summary" />` component
- The label links to the methodology page section explaining that AI process

### Methodology page model info

```
AI Processing
─────────────
Classification: gpt-4o-mini — categorizes stories by province, topic, and sentiment
Summarization: gpt-4o-mini — generates brief summaries (max 150 words)
Last model update: 2026-03-15
```

**The rule:** If a human didn't write it or a primary source didn't provide it, it gets labeled. No exceptions.

---

## 9. Province Index (Replacing the Map)

The interactive Canada map is replaced with a clean, editorial province index on the national dashboard.

### Layout

A styled table with 11 rows (one per province/territory region), sorted by population descending. Each row links to `/provinces/[slug]`.

### Columns

| Column | Content | Style |
|--------|---------|-------|
| Province | Full name + abbreviation badge | Fraunces serif (name), monospace (abbr) |
| AI Institute | Vector Institute / Mila / Amii, or "—" | Regular text, linked to institute URL if present |
| Key University | First university from institutions list | Regular text |
| Data | Dot indicators for which `ProvinceSections` booleans are `true` | Small filled (active) / empty (inactive) circles, one per section flag |
| → | Arrow link | Accent color on hover |

The "Data" column reflects the static `sections` flags from `ProvinceSections` (stories, trends, jobs, stocks, research, parliament) — NOT live data availability. This is a config-time indicator of what data streams are enabled for that province.

### Design

- Container uses `saas-card` class, all colors via CSS custom variables (dark mode compatible)
- Header row: small uppercase muted text (financial index style)
- Row hover: subtle background highlight (`var(--surface-secondary)`)
- Mobile (below `768px`): collapses to Province name + abbreviation + arrow only. AI Institute, Key University, and Data columns are hidden via `display: none` at the breakpoint.
- Section heading: "Province & Territory Profiles" with eyebrow + Fraunces pattern
- 11 rows: 10 provinces + 1 "Northern Territories" (aggregate of YT/NT/NU). Territories are not listed separately.

### Component changes

- **New:** `ProvinceIndex.tsx`
- **Removed from dashboard:** `ProvinceMapSection.tsx` import
- **Kept but unused:** `CanadaMap.tsx`, `ProvincePreviewPanel.tsx` (may be used later)

---

## 10. Dashboard Integration & Cleanup

### Section order (top to bottom)

1. Province & Territory Profiles (new province index)
2. Story Feed (with AI labels, source links)
3. Trends & Insights (with source attribution)
4. Indicators (with source attribution)
5. Research (each paper links to ArXiv)
6. Parliament (each item links to Hansard)

### Dashboard changes

- `ProvinceMapSection` → replaced with `ProvinceIndex`
- Every section gets a source attribution footer: `"Data from [Source Name →]"`
- AI summaries in story feed get `<AILabel level="summary" />`
- AI classifications get `<AILabel level="classification" />`

### Files to create

| File | Purpose |
|------|---------|
| `frontend/src/lib/source-registry.ts` | Central source registry |
| `frontend/src/components/ProvinceIndex.tsx` | Province index table |
| `frontend/src/components/AILabel.tsx` | Reusable AI attribution label |
| `frontend/src/components/SourceAttribution.tsx` | Reusable source footer |

### Files to modify

| File | Change |
|------|--------|
| `frontend/src/lib/provinces-config.ts` | Strip fabricated content, add URLs, remove `aiHub` |
| `frontend/src/app/dashboard/page.tsx` | Swap map for index, add source attributions |
| `frontend/src/app/methodology/page.tsx` | Auto-generate from source registry |
| `frontend/src/components/StoryFeed.tsx` | Add AI labels and source links |
| `frontend/src/components/IndicatorsSection.tsx` | Add `<SourceAttribution sourceId="stocks" />` footer |
| `frontend/src/components/TrendsInsightsSection.tsx` | Add `<SourceAttribution sourceId="google-trends" />` footer |
| `frontend/src/components/LabFeedsSection.tsx` | Add `<SourceAttribution sourceId="arxiv" />` footer |
| `frontend/src/components/ProvinceIndexSection.tsx` | Remove (replaced by `ProvinceIndex.tsx`) |
| `frontend/src/hooks/usePolling.ts` | Add `fallbackUrl`, `isEmpty`, `isFallback` support |

### Not in this phase

- New data sources (BetaKit, ISED, NSERC, etc.) — follow-up work
- Polling/caching architecture changes
- AI summarization pipeline changes — just label existing output

---

## Decisions Log

| # | Question | Decision |
|---|----------|----------|
| 1 | Audience | General public + researchers (accessible surface, rigorous depth) |
| 2 | Province data approach | Verified anchors (3 real institutes) + dynamic data tells the story |
| 3 | AI summaries | AI for structure (classify, tag) + clearly labeled summaries with source links |
| 4 | Empty province pages | Roll up to national with clear "Showing national" label |
| 5 | Citation rigor | Item-level source links + auto-generated methodology page (think tank standard) |
| 6 | Overall approach | B — Data Integrity Overhaul |
