# Provincial Pages & Dashboard Refresh — Design Spec

**Date**: 2026-03-25
**Status**: Draft
**Scope**: Phase 1 of transforming AI Canada Pulse into the definitive Canadian AI intelligence platform

---

## Problem

AI Canada Pulse is currently a single national dashboard. To become the go-to source for Canadians to understand AI's impact, it needs geographic depth — letting users explore AI activity in their own province. No competing Canadian source offers this.

## Goal

Add dedicated province/territory pages with localized AI data, accessible from a refreshed national dashboard that features an interactive Canada map. Apply a warm, accessible visual design across the entire site.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Priority | Provincial pages first | Most differentiating feature; geographic depth is unique |
| Navigation | Hub-and-spoke | National dashboard as hub, province pages as deep dives |
| Province data | Data-first, gaps OK | Ship fast with available data, fill in over time |
| Selector | Map + Preview Panel | Geographic identity + data density without clicking through |
| Scope | All 13 regions | 10 province pages + 1 combined Northern Territories = 11 pages |
| URL structure | `/provinces/[slug]` | Clean, SEO-friendly, shareable |
| Dashboard changes | Refresh with provincial gateway | Map replaces METR hero; full warm restyle |
| Architecture | Hybrid (extend + curate) | Province-specific layout + filtered existing data + config-driven sections |
| Visual direction | Warm & accessible | Editorial typography, cream palette, welcoming to all Canadians |
| Restyle scope | Full dashboard | Consistent warm design across national + provincial views |
| Territory handling | Combined page | One "Northern Territories" page for Yukon, NWT, Nunavut |

---

## Information Architecture

### Routes

```
/                                → Redirect to /dashboard
/dashboard                       → National dashboard (refreshed)
/provinces/ontario               → Ontario
/provinces/quebec                → Quebec
/provinces/british-columbia      → British Columbia
/provinces/alberta               → Alberta
/provinces/manitoba              → Manitoba
/provinces/saskatchewan          → Saskatchewan
/provinces/nova-scotia           → Nova Scotia
/provinces/new-brunswick         → New Brunswick
/provinces/newfoundland          → Newfoundland & Labrador
/provinces/pei                   → Prince Edward Island
/provinces/northern-territories  → Combined Yukon, NWT, Nunavut
/methodology                     → Unchanged
/insights                        → Unchanged
```

### Navigation

- Header gains a "Provinces" link (dropdown on desktop, select on mobile)
- Province pages have breadcrumbs: Dashboard / Provinces / [Name]
- Province page footer links back to national dashboard + neighboring provinces

---

## Visual Design System

### Direction: Warm & Accessible Canadian

The design rejects the "generic AI dashboard" aesthetic (dark backgrounds, neon accents, glass cards, identical stat-card grids). Instead it follows editorial design principles.

### Design Language

- **Typography drives hierarchy.** Fraunces (serif) for headlines, province names, and large stat numbers. Manrope (sans) for body text, labels, and UI elements. The type does the visual work — not colored cards or badges.
- **Warm palette.** Cream (#FAF8F4) backgrounds, warm whites, earthy terracotta (#C2410C) accent, forest green (#166534) for positive indicators. Dark mode inverts to warm dark tones (not pure black).
- **Whitespace as structure.** Sections separated by thin horizontal rules and generous padding, not colored containers or card borders.
- **Stats as ribbons, not cards.** Secondary stats flow horizontally separated by fine vertical rules — like a newspaper masthead. One hero stat is pulled large as a design element.
- **Institutions as prose.** Key players listed inline with middot separators, bold for research labs, regular weight for others. Not pill badges.
- **Stories as a list.** Headline-forward, no background fills, minimal tags right-aligned. Newspaper index style.
- **Data gaps are conversational.** Dashed border, plain text: "We're building this section." No emoji, no error states.

### CSS Variable Updates

The existing CSS variable system (`--bg-page`, `--surface-primary`, `--text-primary`, `--accent-primary`, etc.) is updated with the warm palette:

**Light mode:**
- `--bg-page`: #FAF8F4 (cream)
- `--surface-primary`: #FFFFFF (warm white)
- `--text-primary`: #1C1917 (ink)
- `--text-secondary`: #44403C (ink soft)
- `--text-muted`: #78716C (ink muted)
- `--accent-primary`: #C2410C (maple/terracotta)
- `--accent-positive`: #166534 (forest green)
- `--border-subtle`: #E7E5E4

**Dark mode:**
- `--bg-page`: #1C1917 (warm black)
- `--surface-primary`: #292524 (stone-800)
- `--text-primary`: #FAFAF9 (stone-50)
- `--text-secondary`: #D6D3D1 (stone-300)
- `--text-muted`: #A8A29E (stone-400)
- `--accent-primary`: #EA580C (maple, slightly brighter for dark bg)
- `--accent-positive`: #22C55E (forest green, brighter for dark bg)
- `--border-subtle`: #44403C (stone-700)

### Fonts

Unchanged — already using Manrope (UI) and Fraunces (display). These are core to the new design.

---

## Province Page Design

### Layout (top to bottom)

1. **Breadcrumb** — Dashboard / Provinces / [Name]
2. **Province Hero** — Asymmetric 2-column layout
   - Left: Province label, large Fraunces name (56px), editorial description paragraph
   - Right: One pull-quote stat (e.g., "12.4k AI positions") at 80px — a design element, not a data table
3. **Stats Ribbon** — Horizontal row of 4 secondary stats (search interest, research hubs, news tone, capital/population) separated by vertical rules. No cards.
4. **Key Players** — Inline prose list of institutions and companies, bold for labs
5. **What's Happening** — Region-filtered stories in newspaper-list format (headline, source, time, tag)
6. **AI Search Interest** — Province-specific Google Trends chart (warm palette)
7. **AI Job Market** — Region-filtered job listings (reuses existing component, restyled)
8. **Market Data** — Province-HQ'd stock tickers (reuses existing component, restyled)
9. **Research Output** — Papers from local institutions (reuses existing component, restyled)
10. **Coming Soon sections** — Dashed border, conversational placeholder text
11. **Footer nav** — Back to national dashboard + "Also explore" neighboring provinces

### Conditional rendering

Each section only appears if the province config enables it AND data is available. Config drives section visibility; runtime data availability determines whether to show content or a "coming soon" state.

---

## National Dashboard Changes

### Hero replacement

The METR benchmark chart hero is replaced by a **Canada Map + Preview Panel**:

- Left: Interactive SVG map of Canada. Provinces are hoverable/clickable regions. The active province highlights in the accent color.
- Right: Preview panel showing key stats for the hovered province (name, AI jobs, trend direction, top institution). "View full profile →" link navigates to the province page.
- Below the map: Fraunces headline, e.g., "AI activity across Canada's provinces and territories"

The METR chart moves to a secondary position within "Canada Capacity" or is available on the methodology page.

### Section restyle

All existing dashboard sections are restyled with the warm design system:
- Glass cards → white cards on cream with subtle borders
- Neon accent colors → terracotta and forest green
- Card-grid stat displays → ribbon/editorial layouts where appropriate
- Story cards → newspaper-list format
- Chart themes updated to warm palette

### What stays the same

- Three-section narrative: Acceleration Signals, Canada Capacity, Market & Policy Impact
- All 17 API routes (functional code untouched)
- All data client libraries (only adding optional `region` filter params)
- `usePolling` hook (unchanged)
- Light/dark toggle (updated with warm palette)
- 2-minute polling interval, tab-visibility pause

---

## Data Architecture

### Province Config

New file: `frontend/src/lib/provinces-config.ts`

Static configuration for all 11 regions:

```typescript
interface ProvinceConfig {
  slug: string;              // URL slug: "ontario"
  name: string;              // Display name: "Ontario"
  abbreviation: string;      // "ON"
  capital: string;           // "Toronto"
  population: string;        // "15.8M"
  description: string;       // Editorial blurb for hero
  aiHub: string;             // "Toronto-Waterloo Corridor"
  googleTrendsGeo: string;   // "CA-ON"
  institutions: {
    name: string;
    type: 'lab' | 'university' | 'company';
    url?: string;
  }[];
  sections: {
    stories: boolean;
    trends: boolean;
    jobs: boolean;
    stocks: boolean;
    research: boolean;
    parliament: boolean;
  };
  neighborSlugs: string[];   // ["quebec", "manitoba"]
  // For combined Northern Territories page:
  subRegions?: string[];     // ["yukon", "northwest-territories", "nunavut"]
}
```

### Client extensions

| Client | Current state | Change needed |
|--------|---------------|---------------|
| `rss-client.ts` | Already detects region per story | Add filter-by-region export function |
| `trends-regional-client.ts` | Already returns per-province data | Extract single-province getter |
| `jobs-client.ts` | Queries Indeed Canada broadly | Add province param to RSS query URL |
| `stocks-client.ts` | Tracks 10 TSX companies | Add province-HQ mapping to config |
| `parliament-client.ts` | Returns all AI mentions | Filter by speaker riding province if available |
| `research-client.ts` | Filters by 20+ institutions | Filter by province-based institution list |

### API route changes

Existing routes gain an optional `?region=` query parameter. All routes use `?region=` with the province slug (e.g., `ontario`) for consistency. The one exception is `trends-regional` which already uses its own geo code format.

- `/api/v1/stories?region=ontario` — filters stories by region tag
- `/api/v1/trends-regional?province=ON` — already works, no change (uses abbreviation)
- `/api/v1/jobs?region=ontario` — filters Indeed query by province
- `/api/v1/stocks?region=ontario` — filters by company HQ province

No new API routes needed. Province pages call existing routes with filter params.

### SVG Map Source

The `CanadaMap.tsx` component uses a hand-crafted SVG with simplified province boundary paths. Each province is a `<path>` element with a `data-slug` attribute matching the URL slug. The SVG should be created from a public-domain source (Natural Resources Canada boundary data or SimpleMaps) and simplified for web use — geometric accuracy is secondary to clear province identification and hover/click interactivity.

### Static Generation

The `/provinces/[slug]` route should use `generateStaticParams()` to pre-render all 11 pages at build time, since the slugs are known and fixed. Dynamic data is fetched client-side via `usePolling`.

### Caching

- Province-filtered responses use the same `unstable_cache` layer with region-specific cache keys
- Client-side polling via `usePolling` unchanged (2-minute interval)
- Province config is static — no caching needed

---

## New Files

| File | Purpose |
|------|---------|
| `frontend/src/lib/provinces-config.ts` | Static config for all 11 regions |
| `frontend/src/app/provinces/[slug]/page.tsx` | Dynamic province page (SSR) |
| `frontend/src/components/ProvinceHero.tsx` | Province hero with asymmetric layout |
| `frontend/src/components/ProvinceStatsRibbon.tsx` | Horizontal stats ribbon |
| `frontend/src/components/ProvinceInstitutions.tsx` | Inline institution list |
| `frontend/src/components/ProvinceMapSection.tsx` | Map + Preview Panel for national dashboard |
| `frontend/src/components/CanadaMap.tsx` | Reusable interactive SVG map |
| `frontend/src/components/ProvincePreviewPanel.tsx` | Stats panel next to map |
| `frontend/src/components/ComingSoonSection.tsx` | Friendly placeholder for missing data |

## Modified Files

| File | Change |
|------|--------|
| `frontend/src/app/globals.css` | Warm design system CSS variables + restyle global classes |
| `frontend/src/app/dashboard/page.tsx` | Replace METR hero with MapSection, restyle sections |
| `frontend/src/app/layout.tsx` | Update dark mode script with warm dark palette |
| `frontend/src/components/Header.tsx` | Add "Provinces" navigation link |
| `frontend/src/components/StoryFeed.tsx` | Accept optional `region` prop for filtering |
| `frontend/src/components/TrendsSection.tsx` | Accept optional `province` prop |
| `frontend/src/components/TrendsInsightsSection.tsx` | Accept optional province highlight |
| `frontend/src/components/StocksSection.tsx` | Accept optional `province` filter |
| `frontend/src/components/JobMarketSection.tsx` | Accept optional `province` filter |
| `frontend/src/components/SentimentSection.tsx` | Accept optional `region` filter |
| `frontend/src/components/ArxivSection.tsx` | Accept optional institution filter |
| `frontend/src/hooks/useChartTheme.ts` | Update warm palette for ECharts |
| `frontend/src/lib/rss-client.ts` | Add `getStoriesByRegion()` export |
| `frontend/src/lib/jobs-client.ts` | Add province param to queries |
| `frontend/src/lib/stocks-client.ts` | Add province-HQ filtering |
| `frontend/src/app/api/v1/stories/route.ts` | Handle `?region=` query param |
| `frontend/src/app/api/v1/jobs/route.ts` | Handle `?province=` query param |
| `frontend/src/app/api/v1/stocks/route.ts` | Handle `?province=` query param |

---

## What Is NOT In Scope

- New external data sources (municipal data, additional RSS feeds, etc.)
- Public vs. private sector framing
- Real-time push notifications or live feeds
- AI-powered provincial summaries or briefings
- User accounts or personalization
- Mobile app
- SEO/meta tag optimization (can be added as a fast follow)

---

## Verification

1. `npm run build` passes with no errors
2. `npm run dev` serves on port 3001
3. `/dashboard` loads with new map hero section and warm design
4. Clicking a province on the map navigates to `/provinces/[slug]`
5. Province pages render with correct data for data-rich provinces (Ontario, Quebec, BC, Alberta)
6. Province pages show "coming soon" sections gracefully for sparse provinces (PEI, Saskatchewan)
7. Northern Territories page shows combined data
8. Light/dark toggle works with warm palette on both dashboard and province pages
9. All existing API routes still return valid data
10. Province-filtered API routes return correct subsets
11. Mobile responsive — map section adapts, province page stacks cleanly
