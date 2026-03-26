# Provincial Pages & Dashboard Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 11 province/territory pages with localized AI data, an interactive Canada map on the national dashboard, and a warm editorial visual redesign across the entire site.

**Architecture:** Hub-and-spoke — national dashboard links to `/provinces/[slug]` pages via an interactive SVG map. Province pages reuse existing section components with a `region` filter prop. A static config file drives which sections appear per province. The visual design shifts from dark glass-card aesthetic to warm cream/terracotta editorial style.

**Tech Stack:** Next.js 14 App Router, React 19, Tailwind CSS 4, TypeScript, ECharts, CSS custom properties

**Spec:** `docs/superpowers/specs/2026-03-25-provincial-pages-design.md`

**No test framework configured** — verification is via `npm run build`, `npm run dev`, and manual browser checks.

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `frontend/src/lib/provinces-config.ts` | Static config for all 11 regions (slug, name, institutions, section flags) |
| `frontend/src/app/provinces/[slug]/page.tsx` | Dynamic province page with `generateStaticParams` |
| `frontend/src/components/ProvinceHero.tsx` | Asymmetric hero: Fraunces name + editorial description + pull-quote stat |
| `frontend/src/components/ProvinceStatsRibbon.tsx` | Horizontal stats ribbon separated by vertical rules |
| `frontend/src/components/ProvinceInstitutions.tsx` | Inline prose list of key players |
| `frontend/src/components/ComingSoonSection.tsx` | Friendly placeholder for missing data sections |
| `frontend/src/components/CanadaMap.tsx` | Interactive SVG map with hover/click per province |
| `frontend/src/components/ProvincePreviewPanel.tsx` | Stats panel that updates on map hover |
| `frontend/src/components/ProvinceMapSection.tsx` | Map + Preview Panel composed together for dashboard |

### Modified Files
| File | Change |
|------|--------|
| `frontend/src/app/globals.css` | Replace CSS variables with warm palette, restyle `.saas-card`/`.glass-card` |
| `frontend/src/app/layout.tsx` | Update inline theme script with warm dark mode hex values |
| `frontend/src/hooks/useChartTheme.ts` | Replace LIGHT/DARK constants with warm palette |
| `frontend/src/components/Header.tsx` | Add "Provinces" nav link |
| `frontend/src/lib/rss-client.ts` | Add `filterStoriesByRegion()` export |
| `frontend/src/lib/stocks-client.ts` | Add `provinceHQ` field to ticker config |
| `frontend/src/lib/jobs-client.ts` | Add optional `province` param to Indeed RSS query |
| `frontend/src/app/api/v1/stories/route.ts` | Handle `?region=` query param |
| `frontend/src/app/api/v1/jobs/route.ts` | Handle `?region=` query param |
| `frontend/src/app/api/v1/stocks/route.ts` | Handle `?region=` query param |
| `frontend/src/components/StoryFeed.tsx` | Accept optional `region` prop, pass to API |
| `frontend/src/components/StocksSection.tsx` | Accept optional `region` prop |
| `frontend/src/components/JobMarketSection.tsx` | Accept optional `region` prop |
| `frontend/src/components/SentimentSection.tsx` | Accept optional `region` prop |
| `frontend/src/components/TrendsInsightsSection.tsx` | Accept optional province highlight |
| `frontend/src/app/dashboard/page.tsx` | Replace METR hero with ProvinceMapSection, update section styling |

---

## Task 1: Province Config

**Files:**
- Create: `frontend/src/lib/provinces-config.ts`

This is the foundation — everything else references it.

- [ ] **Step 1: Create the provinces config file**

Create `frontend/src/lib/provinces-config.ts` with the `ProvinceConfig` interface and a `PROVINCES` array containing all 11 entries. Each entry needs: `slug`, `name`, `abbreviation`, `capital`, `population`, `description` (1-2 sentence editorial blurb), `aiHub`, `googleTrendsGeo`, `institutions` array, `sections` flags object, `neighborSlugs`, and optional `subRegions` for the Northern Territories entry.

Key data points per province:
- **Ontario**: slug `ontario`, abbrev `ON`, capital Toronto, pop 15.8M, hub "Toronto–Waterloo Corridor", institutions: Vector Institute (lab), CIFAR (lab), U of Toronto (university), U of Waterloo (university), Cohere (company), Shopify (company). All sections enabled.
- **Quebec**: slug `quebec`, abbrev `QC`, capital Quebec City, pop 8.9M, hub "Montreal AI Corridor", institutions: Mila (lab), McGill (university), Université de Montréal (university), Element AI legacy (company). All sections enabled.
- **British Columbia**: slug `british-columbia`, abbrev `BC`, capital Victoria, pop 5.4M, hub "Vancouver Tech Hub", institutions: UBC (university), Simon Fraser (university), D-Wave (company). All sections enabled.
- **Alberta**: slug `alberta`, abbrev `AB`, capital Edmonton, pop 4.6M, hub "Edmonton AI Corridor", institutions: Amii (lab), U of Alberta (university). All sections enabled.
- **Manitoba** through **PEI**: Enable stories and trends. Disable stocks, research, parliament. Fewer institutions.
- **Northern Territories**: slug `northern-territories`, subRegions: ["yukon", "northwest-territories", "nunavut"]. Only stories and trends enabled.

Export: `PROVINCES` array, `getProvinceBySlug(slug)` helper, `getAllProvinceSlugs()` helper, and the `ProvinceConfig` type.

- [ ] **Step 2: Verify it compiles**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to provinces-config.ts

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/provinces-config.ts
git commit -m "feat: add province config for all 11 regions"
```

---

## Task 2: Warm Design System — CSS Variables

**Files:**
- Modify: `frontend/src/app/globals.css`

Replace the existing CSS custom properties with the warm palette. This is the highest-impact visual change.

- [ ] **Step 1: Update `:root` light mode variables**

In `globals.css`, replace the existing `:root` variable block. Key changes:
- `--bg-page`: `#faf8f4` (was `#f9fafb`)
- `--surface-primary`: `#ffffff` (keep)
- `--surface-elevated`: `#ffffff` (keep)
- `--text-primary`: `#1c1917` (was `#0f172a`)
- `--text-secondary`: `#44403c` (was `#334155`)
- `--text-muted`: `#78716c` (was `#64748b`)
- `--accent-primary`: `#c2410c` (was `#4f46e5` — major change from indigo to terracotta)
- `--accent-secondary`: `#ea580c` (was `#7c3aed`)
- `--accent-glow`: `rgba(194, 65, 12, 0.08)` (was indigo glow)
- `--accent-surface`: `rgba(194, 65, 12, 0.04)`
- `--status-positive`: `#166534` (was `#15803d`)
- `--border-subtle`: `#e7e5e4` (was `#e2e8f0`)
- `--border-strong`: `#d6d3d1` (was `#cbd5e1`)
- `--divider`: `#e7e5e4`
- `--shadow-soft`: `0 1px 3px rgba(28, 25, 23, 0.06)` (warm shadow)
- `--header-bg`: `rgba(250, 248, 244, 0.85)` (cream with blur)
- `--header-border`: `#e7e5e4`
- `--radius-card`: `12px` (was `20px` — less rounded for editorial feel)

- [ ] **Step 2: Update `[data-theme="dark"]` variables**

Key dark mode changes:
- `--bg-page`: `#1c1917` (warm black, was `#0b0f19`)
- `--surface-primary`: `#292524` (stone-800)
- `--text-primary`: `#fafaf9` (stone-50)
- `--text-secondary`: `#d6d3d1` (stone-300)
- `--text-muted`: `#a8a29e` (stone-400)
- `--accent-primary`: `#ea580c` (brighter terracotta for dark bg)
- `--accent-secondary`: `#f97316`
- `--status-positive`: `#22c55e` (brighter green)
- `--border-subtle`: `#44403c` (stone-700)
- `--header-bg`: `rgba(28, 25, 23, 0.85)`

- [ ] **Step 3: Simplify `.glass-card` / `.saas-card` styles**

Replace the gradient + backdrop-blur + sheen styles with a clean editorial card:
```css
.glass-card, .saas-card {
  position: relative;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--surface-primary);
  box-shadow: var(--shadow-soft);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.glass-card:hover, .saas-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-elevated);
}
```
Remove the `::before` sheen pseudo-element, the `backdrop-filter`, and the gradient background. Clean and warm.

- [ ] **Step 4: Verify the build still works**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/globals.css
git commit -m "style: replace CSS variables with warm editorial palette"
```

---

## Task 3: Warm Design System — Chart Theme & Layout

**Files:**
- Modify: `frontend/src/hooks/useChartTheme.ts`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Update useChartTheme LIGHT constants**

In `useChartTheme.ts`, replace the LIGHT object:
```typescript
const LIGHT: ChartTheme = {
  text: "#1c1917",
  textSecondary: "#44403c",
  textMuted: "#78716c",
  axisLine: "#d6d3d1",
  splitLine: "#f5f5f4",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e7e5e4",
  tooltipText: "#44403c",
  tooltipValue: "#1c1917",
  accent: "#c2410c",
  accentDim: "rgba(194, 65, 12, 0.12)",
  positive: "#166534",
  negative: "#dc2626",
  neutral: "#a8a29e",
};
```

- [ ] **Step 2: Update useChartTheme DARK constants**

```typescript
const DARK: ChartTheme = {
  text: "#fafaf9",
  textSecondary: "#d6d3d1",
  textMuted: "#a8a29e",
  axisLine: "#44403c",
  splitLine: "#292524",
  tooltipBg: "#292524",
  tooltipBorder: "#44403c",
  tooltipText: "#d6d3d1",
  tooltipValue: "#fafaf9",
  accent: "#ea580c",
  accentDim: "rgba(234, 88, 12, 0.15)",
  positive: "#22c55e",
  negative: "#f87171",
  neutral: "#78716c",
};
```

- [ ] **Step 3: Update layout.tsx dark mode script**

In `layout.tsx`, update the inline theme script so that the dark mode defaults use warm tones. The script itself doesn't set colors (CSS handles that), but verify the `data-theme` attribute name is still `dark`. No code change needed here unless the script references specific colors — it doesn't, so this step is just verification.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useChartTheme.ts frontend/src/app/layout.tsx
git commit -m "style: update chart theme and layout for warm palette"
```

---

## Task 4: Province Page Components

**Files:**
- Create: `frontend/src/components/ProvinceHero.tsx`
- Create: `frontend/src/components/ProvinceStatsRibbon.tsx`
- Create: `frontend/src/components/ProvinceInstitutions.tsx`
- Create: `frontend/src/components/ComingSoonSection.tsx`

- [ ] **Step 1: Create ProvinceHero component**

Asymmetric 2-column layout. Props: `province: ProvinceConfig`, `heroStat: { value: string; unit: string; change: string }`.

Left column: "Province Profile" eyebrow label (11px uppercase, `--accent-primary`), province name in Fraunces at a large size, editorial description paragraph.

Right column: One pull-quote stat — large Fraunces number, unit label below, change indicator.

Use inline styles referencing CSS variables (consistent with existing codebase pattern). Use `var(--font-display)` for Fraunces, `var(--font-ui)` for Manrope.

Responsive: On mobile (below 768px), stack to single column.

- [ ] **Step 2: Create ProvinceStatsRibbon component**

Props: `stats: Array<{ label: string; value: string; note: string; isPositive?: boolean }>`.

Horizontal flex container. Each stat is a flex-1 item with `padding: 0 24px` and `border-right: 1px solid var(--border-subtle)` (last child has no border). Label is 11px uppercase muted, value is Fraunces medium, note is 12px in either muted or positive color.

Responsive: On mobile, wrap to 2-column grid.

- [ ] **Step 3: Create ProvinceInstitutions component**

Props: `institutions: ProvinceConfig['institutions']`.

Renders: "Key Players" eyebrow label, then an inline list. Labs are bold (`font-weight: 600`), others are regular. Middot separators between items. Uses `var(--text-primary)` for bold, `var(--text-secondary)` for regular.

- [ ] **Step 4: Create ComingSoonSection component**

Props: `title: string; message?: string`.

Renders: Section header with Fraunces title, then a dashed-border container centered text: "We're building this section" (bold), and optional message below (muted). Border: `1px dashed var(--border-subtle)`, background: `var(--surface-primary)`, border-radius: `12px`.

- [ ] **Step 5: Verify build**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ProvinceHero.tsx frontend/src/components/ProvinceStatsRibbon.tsx frontend/src/components/ProvinceInstitutions.tsx frontend/src/components/ComingSoonSection.tsx
git commit -m "feat: add province page components (hero, ribbon, institutions, coming-soon)"
```

---

## Task 5: Data Client Extensions

**Important naming convention:** The existing `detectRegion` in rss-client.ts tags stories with **display names** (e.g., "Ontario", "British Columbia"). All `?region=` API params use **province slugs** (e.g., "ontario", "british-columbia"). The filter function must map between these. Province config contains both `slug` and `name` for this purpose.

**Files:**
- Modify: `frontend/src/lib/rss-client.ts`
- Modify: `frontend/src/lib/stocks-client.ts`
- Modify: `frontend/src/lib/jobs-client.ts`
- Modify: `frontend/src/lib/trends-regional-client.ts`

- [ ] **Step 1: Add `filterStoriesByRegion` to rss-client.ts**

Add a new exported function at the bottom of the file. It accepts a display name (matching what `detectRegion` produces):

```typescript
export function filterStoriesByRegion(stories: Story[], regionName: string): Story[] {
  const target = regionName.toLowerCase();
  return stories.filter(s => s.region.toLowerCase() === target);
}
```

The `detectRegion` function tags stories with display names: "Ontario", "Quebec", "British Columbia", "Alberta", "Federal", "Canada". Callers pass the province display name (from config's `name` field).

For the Northern Territories page, callers should pass "Canada" as the region (stories from territories are unlikely to match specific territory names and will fall through to the "Canada" default).

- [ ] **Step 2: Add `provinceHQ` to stocks-client.ts ticker config**

Modify the `CANADIAN_AI_TICKERS` array to include a `provinceHQ` field:

```typescript
const CANADIAN_AI_TICKERS = [
  { symbol: "SHOP.TO", name: "Shopify", provinceHQ: "ontario" },
  { symbol: "KXS.TO", name: "Kinaxis", provinceHQ: "ontario" },
  { symbol: "CVO.TO", name: "Coveo Solutions", provinceHQ: "quebec" },
  { symbol: "OTEX.TO", name: "OpenText", provinceHQ: "ontario" },
  { symbol: "GIB-A.TO", name: "CGI Group", provinceHQ: "quebec" },
  { symbol: "BB.TO", name: "BlackBerry", provinceHQ: "ontario" },
  { symbol: "DCBO.TO", name: "Docebo", provinceHQ: "ontario" },
  { symbol: "LSPD.TO", name: "Lightspeed Commerce", provinceHQ: "quebec" },
  { symbol: "THNK.V", name: "Think Research", provinceHQ: "ontario" },
  { symbol: "MNDM.TO", name: "Mandalay Resources", provinceHQ: "ontario" },
];
```

Add a new export:

```typescript
export function filterStocksByProvince(data: StocksData, province: string): StocksData {
  const filtered = data.quotes.filter(q => {
    const ticker = CANADIAN_AI_TICKERS.find(t => t.symbol === q.symbol);
    return ticker?.provinceHQ === province;
  });
  return { quotes: filtered, fetchedAt: data.fetchedAt };
}
```

- [ ] **Step 3: Add province param to jobs-client.ts**

The Indeed RSS URL already supports location filtering. Modify the fetch URL construction to accept an optional province name:

Add a `province` parameter to the internal fetch function. When provided, replace `l=Canada` with `l=${province}` in the Indeed RSS URL:

```typescript
// Change the URL construction inside the fetch loop:
const location = province ? encodeURIComponent(province) : "Canada";
const url = `https://ca.indeed.com/rss?q=${query}&l=${location}&sort=date`;
```

Read jobs-client.ts first to find the main fetch function name (likely `_fetchAIJobMarket`). Add an optional `province?: string` parameter to it. Thread this parameter through to the Indeed RSS URL. The exported cached wrapper should also accept the optional param and pass it through. When province is undefined, the behavior is identical to today (queries `l=Canada`).

- [ ] **Step 4: Add single-province getter to trends-regional-client.ts**

Read `frontend/src/lib/trends-regional-client.ts`. It already returns per-province Google Trends data (all provinces at once). Add a new export:

```typescript
export function getProvinceTrend(allData: RegionalTrendsData, abbreviation: string) {
  // Extract the single province's trend data from the full regional response
  // The abbreviation matches the Google Trends geo code (e.g., "ON", "QC", "BC")
  return allData.regions?.find(r => r.geoCode === `CA-${abbreviation}`) ?? null;
}
```

Read the file to determine the exact data shape and field names — the function above is a template. The key is extracting one province from the already-fetched regional data, not making a new API call.

- [ ] **Step 5: Verify build**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/rss-client.ts frontend/src/lib/stocks-client.ts frontend/src/lib/jobs-client.ts frontend/src/lib/trends-regional-client.ts
git commit -m "feat: add regional filtering to data clients (stories, stocks, jobs, trends)"
```

---

## Task 6: API Route Updates

**Files:**
- Modify: `frontend/src/app/api/v1/stories/route.ts`
- Modify: `frontend/src/app/api/v1/jobs/route.ts`
- Modify: `frontend/src/app/api/v1/stocks/route.ts`

- [ ] **Step 1: Add `?region=` support to stories route**

Read the existing route file first. Then add: parse `searchParams.get('region')` from the request URL. If present, call `filterStoriesByRegion(stories, region)` after fetching all stories. Import `filterStoriesByRegion` from `@/lib/rss-client`.

The pattern:
```typescript
const { searchParams } = new URL(request.url);
const region = searchParams.get('region');
// ... existing fetch logic ...
const result = region ? filterStoriesByRegion(stories, region) : stories;
```

- [ ] **Step 2: Add `?region=` support to jobs route**

Read the existing route file. Add: parse `searchParams.get('region')`. Pass the region as the province parameter to the jobs fetch function. When no region param, behavior is unchanged (national data).

- [ ] **Step 3: Add `?region=` support to stocks route**

Read the existing route file. Add: parse `searchParams.get('region')`. If present, call `filterStocksByProvince(data, region)` on the result. Import from `@/lib/stocks-client`.

- [ ] **Step 4: Verify build**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/api/v1/stories/route.ts frontend/src/app/api/v1/jobs/route.ts frontend/src/app/api/v1/stocks/route.ts
git commit -m "feat: add ?region= query param to stories, jobs, stocks API routes"
```

---

## Task 7: Existing Component Props — Region Filtering

**Important:** When passing region to API routes, use the province **slug** (e.g., "ontario"). When filtering stories by display name, use the province **name** from config (e.g., "Ontario"). The stories API route handles the slug→name mapping internally.

**Files:**
- Modify: `frontend/src/components/StoryFeed.tsx`
- Modify: `frontend/src/components/StocksSection.tsx`
- Modify: `frontend/src/components/JobMarketSection.tsx`
- Modify: `frontend/src/components/SentimentSection.tsx`
- Modify: `frontend/src/components/TrendsInsightsSection.tsx`
- Modify: `frontend/src/components/ArxivSection.tsx`

- [ ] **Step 1: Add `region` prop to StoryFeed**

Read StoryFeed.tsx. It currently uses `useStories()` hook to get stories. Add an optional `region?: string` prop. When `region` is provided, the component should use `usePolling` directly to fetch from `/api/v1/stories?region=${region}` instead of using the shared `useStories()` context (which fetches national data). The `region` value here is a display name like "Ontario" — the API route needs to handle this (or the province page passes the slug and the route maps it). When `region` is not provided, behavior is unchanged.

- [ ] **Step 2: Add `region` prop to StocksSection**

Read StocksSection.tsx. Add optional `region?: string` prop (slug format). When provided, append `?region=${region}` to the API fetch URL. The API route handles filtering.

- [ ] **Step 3: Add `region` prop to JobMarketSection**

Read JobMarketSection.tsx. Add optional `region?: string` prop (slug format). When provided, append `?region=${region}` to the API fetch URL.

- [ ] **Step 4: Add `region` prop to SentimentSection**

Read SentimentSection.tsx. This derives sentiment from stories. Add optional `region?: string` prop. When provided, fetch stories with the region filter and compute sentiment from filtered stories.

- [ ] **Step 5: Add `highlightProvince` prop to TrendsInsightsSection**

Read TrendsInsightsSection.tsx. It already displays Google Trends data for all provinces. Add optional `highlightProvince?: string` prop (abbreviation, e.g., "ON"). When provided, visually highlight that province's data (e.g., bold its row, accent its bar/line color) and optionally sort it to the top. When used on a province page, this makes the current province stand out in the national comparison. When not provided, behavior is unchanged.

- [ ] **Step 6: Add `institutionFilter` prop to ArxivSection**

Read ArxivSection.tsx. It shows research papers. Add optional `institutionFilter?: string[]` prop. When provided, filter displayed papers to only those with authors affiliated with the listed institutions (match against author affiliation strings). The province config's `institutions` array provides the names. When not provided, behavior is unchanged (shows all papers).

If ArxivSection doesn't currently have affiliation data to filter on, instead render `<ComingSoonSection title="Research output" />` from the province page when `province.sections.research` is true. Note this in a code comment so it can be upgraded later.

- [ ] **Step 7: Verify build**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/StoryFeed.tsx frontend/src/components/StocksSection.tsx frontend/src/components/JobMarketSection.tsx frontend/src/components/SentimentSection.tsx frontend/src/components/TrendsInsightsSection.tsx frontend/src/components/ArxivSection.tsx
git commit -m "feat: add optional region/filter props to all section components"
```

---

## Task 8: Province Page Route

**Files:**
- Create: `frontend/src/app/provinces/[slug]/page.tsx`

- [ ] **Step 1: Create the dynamic province page**

This is the main province page component. It:

1. Imports `getProvinceBySlug`, `getAllProvinceSlugs` from `@/lib/provinces-config`
2. Exports `generateStaticParams()` returning all slugs
3. Exports `generateMetadata()` for SEO (title: "Ontario — AI Canada Pulse", description from province config)
4. Reads `params.slug`, looks up province config via `getProvinceBySlug(slug)`
5. Returns `notFound()` if slug doesn't match

Layout (top to bottom):
- Breadcrumb nav (plain links: Dashboard / Provinces / {name})
- `<ProvinceHero province={province} heroStat={...} />`
- `<hr>` divider
- `<ProvinceStatsRibbon stats={[...]} />`
- `<hr>` divider
- `<ProvinceInstitutions institutions={province.institutions} />`
- `<hr>` divider
- Conditional sections based on `province.sections`:
  - `province.sections.stories` → `<StoryFeed region={province.name} />` (display name for story filtering)
  - `province.sections.trends` → `<TrendsInsightsSection highlightProvince={province.abbreviation} />`
  - `province.sections.jobs` → `<JobMarketSection region={province.slug} />`
  - `province.sections.stocks` → `<StocksSection region={province.slug} />`
  - `province.sections.research` → `<ArxivSection institutionFilter={province.institutions.map(i => i.name)} />` OR `<ComingSoonSection title="Research output" />` if ArxivSection lacks affiliation filtering
  - `province.sections.parliament` → `<ComingSoonSection title="Parliamentary mentions" message="We're building provincial parliamentary tracking." />` (intentionally deferred — parliament-client.ts changes are out of scope for this phase)
- Footer nav: back to dashboard + "Also explore:" neighbor links

The `heroStat` values will come from the polling data (jobs count, etc.). For the initial render, use placeholder values from the config or show a loading state. The client-side `usePolling` hooks in each section component will fill in real data.

- [ ] **Step 2: Verify the route works**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -10`
Expected: Build succeeds, static params generate 11 pages

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/provinces/[slug]/page.tsx
git commit -m "feat: add province page route with generateStaticParams for all 11 regions"
```

---

## Task 9: Interactive Canada Map

**Files:**
- Create: `frontend/src/components/CanadaMap.tsx`
- Create: `frontend/src/components/ProvincePreviewPanel.tsx`
- Create: `frontend/src/components/ProvinceMapSection.tsx`

- [ ] **Step 1: Create CanadaMap.tsx**

A `'use client'` component. Props: `onProvinceHover: (slug: string | null) => void`, `onProvinceClick: (slug: string) => void`, `activeSlug: string | null`.

Contains an inline SVG with simplified province boundary `<path>` elements. Each path has:
- `data-slug` attribute matching the province config slug
- `onMouseEnter` → calls `onProvinceHover(slug)`
- `onMouseLeave` → calls `onProvinceHover(null)`
- `onClick` → calls `onProvinceClick(slug)`
- Fill color: `var(--accent-primary)` with low opacity by default, higher opacity on hover/active

The SVG should be a simplified outline of Canada with recognizable province shapes. Use viewBox for responsiveness. Territories (Yukon, NWT, Nunavut) all share `data-slug="northern-territories"`.

**SVG path data source:** Use the Natural Earth public-domain dataset (naturalearthdata.com) Canadian provincial boundaries, or find a pre-simplified Canadian provinces SVG from a public-domain source like Wikimedia Commons (search "Canada blank map SVG"). Alternatively, use `react-simple-maps` with a Canadian topojson from the `world-atlas` npm package and filter to just Canada — but a hand-inlined SVG is preferred for fewer dependencies and smaller bundle size.

The SVG does NOT need geographic precision. Prioritize: (1) each province is clearly identifiable, (2) each is a separate clickable region, (3) relative positions are correct (BC left, Atlantic right, territories top). A stylized/geometric map is acceptable and may even look more editorial than a geographic one.

Key: BC is leftmost, Ontario/Quebec are the large central provinces, Atlantic provinces are right, territories are top.

- [ ] **Step 2: Create ProvincePreviewPanel.tsx**

Props: `slug: string | null`. When slug is null, show a default state ("Hover over a province to see details").

When a slug is provided:
1. Look up province from config via `getProvinceBySlug(slug)`
2. Display: province name (Fraunces, large), capital, population, AI hub
3. List top 2-3 institutions
4. Link: "View full profile →" linking to `/provinces/${slug}`

Style: Right-aligned panel, fixed width (~320px), warm white background, subtle border.

- [ ] **Step 3: Create ProvinceMapSection.tsx**

Composes `CanadaMap` + `ProvincePreviewPanel` side by side. Manages `hoveredSlug` state.

Layout: Section container with "Explore by Province" Fraunces heading above. Flex row: map (flex-1) + preview panel (320px). Below: subtle text "Click a province to see its full AI profile".

Responsive: On mobile, show the map full-width with province name labels, and a dropdown select instead of the preview panel.

This is a `'use client'` component (manages hover state).

- [ ] **Step 4: Verify build**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/CanadaMap.tsx frontend/src/components/ProvincePreviewPanel.tsx frontend/src/components/ProvinceMapSection.tsx
git commit -m "feat: add interactive Canada map with province preview panel"
```

---

## Task 10: Header Navigation Update

**Files:**
- Modify: `frontend/src/components/Header.tsx`

- [ ] **Step 1: Add Provinces link to header**

Read Header.tsx (65 lines). Currently has a "Sources" link to `/methodology` on the right side. Add a "Provinces" link next to it, styled identically (rounded-full border button). Links to `/provinces/ontario` as a sensible default, or could be an anchor to the map section on the dashboard (`/dashboard#provinces`).

Keep the styling consistent with the existing "Sources" button — `rounded-full`, `border: 1px solid var(--border-strong)`, `color: var(--text-secondary)`, `background: var(--surface-primary)`.

- [ ] **Step 2: Update the logo gradient**

The current logo uses `bg-gradient-to-br from-indigo-600 to-violet-600` with an indigo shadow. Update to the warm palette: a warm gradient (terracotta to orange tones) with matching shadow. Example: `from-orange-700 to-amber-600` with `shadow-[0_8px_30px_rgba(194,65,12,0.3)]`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Header.tsx
git commit -m "feat: add Provinces nav link and warm logo colors to header"
```

---

## Task 11: Dashboard Page Refresh

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`

This is the largest single modification — replacing the hero and updating section styling.

- [ ] **Step 1: Replace METR hero with ProvinceMapSection**

Read dashboard/page.tsx (138 lines). Remove the `<HeroBanner />` + `<METRHeroChart />` hero section (the gradient container at the top). Replace with `<ProvinceMapSection />`.

Import `ProvinceMapSection` from `@/components/ProvinceMapSection`.

The map section should sit between the Header and the SectionNav, in the same position the METR hero occupied.

- [ ] **Step 2: Update SectionTitle component styling**

The inline `SectionTitle` component in this file uses tailwind classes. Update:
- Eyebrow: change color to `var(--accent-primary)` (terracotta)
- Title h2: use `font-display` (Fraunces) class instead of default sans
- Description: keep `var(--text-muted)`

- [ ] **Step 3: Restyle section containers**

Update the section wrappers. Currently they use `saas-card` class with padding. The cards will automatically pick up the new warm styles from globals.css (Task 2). But verify the section backgrounds, spacing, and dividers look correct with the warm palette.

Remove any inline styles that reference old colors (indigo, violet) and replace with CSS variable references.

- [ ] **Step 4: Verify dashboard loads**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run dev`
Open http://localhost:3001/dashboard — verify map loads, sections render, warm palette applied.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat: replace METR hero with Canada map, restyle dashboard sections"
```

---

## Task 12: Final Verification & Build

- [ ] **Step 1: Full build check**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run build`
Expected: Build completes with no errors. Should show 11 static province pages generated.

- [ ] **Step 2: Lint check**

Run: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run lint`
Expected: No new lint errors introduced.

- [ ] **Step 3: Manual verification checklist**

Start dev server: `cd "C:\Users\scott\code\ai-canada-pulse\frontend" && npm run dev`

Verify in browser:
1. `/dashboard` — Map hero section visible, warm cream palette, all sections load
2. Click Ontario on map → navigates to `/provinces/ontario`
3. `/provinces/ontario` — Hero, stats ribbon, institutions, stories, charts all render
4. `/provinces/pei` — Sparse page with "coming soon" sections
5. `/provinces/northern-territories` — Combined territories page loads
6. Toggle dark mode — warm dark tones (not cold blue/gray)
7. Mobile responsive — resize to 375px width, verify map stacks, province page stacks
8. `/dashboard` — All existing sections (Trends, Stocks, Sentiment, etc.) still functional
9. API routes still work: `/api/v1/stories` returns data, `/api/v1/stories?region=ontario` returns filtered

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup and verification for provincial pages"
```
