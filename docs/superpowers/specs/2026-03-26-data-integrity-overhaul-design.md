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
- Every API response includes a `_source` field: `{ id, name, url }`
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

- `aiHub` field → removed from the `ProvinceConfig` interface entirely
- `description` → replaced with a factual one-liner: population rank, which (if any) of the 3 national AI institutes is located there, number of universities with AI programs
- `InstitutionConfig.url` → required (was optional). If you can't link it, it doesn't go on the site
- `InstitutionConfig.sourceId` → new required field referencing `source-registry.ts`

```typescript
export interface InstitutionConfig {
  name: string
  type: "institute" | "university" | "company"
  url: string                    // REQUIRED — verifiable link
  sourceId: string               // references source-registry.ts
}
```

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

- API responses include `sourceUrl` and `sourceName` on every item
- Section components render a clickable source link on each item
- Each dashboard section has a footer: `"Data from [Source Name →]"` linking to source URL

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
- `usePolling` hook gets an optional `fallbackUrl` — if primary returns empty, re-fetches from fallback
- A `<ScopeLabel>` component renders either "Provincial" or "National" with appropriate styling

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
| AI Institute | Vector Institute / Mila / Amii, or "—" | Regular text, linked if present |
| Key University | First university from institutions list | Regular text |
| Sections | Dot indicators for active data sections | Small filled/empty circles |
| → | Arrow link | Accent color on hover |

### Design

- Container uses `saas-card` class
- Header row: small uppercase muted text (financial index style)
- Row hover: subtle background highlight (`var(--surface-secondary)`)
- Mobile: collapses to Province name + arrow only
- Section heading: "Province & Territory Profiles" with eyebrow + Fraunces pattern

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
| Other section components | Add source attribution footers |

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
