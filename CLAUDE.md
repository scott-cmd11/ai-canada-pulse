# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Active Codebase

The active code lives in `frontend/`. The root-level `app/`, `components/`, `lib/`, `messages/` directories are **legacy** and not deployed. Vercel deploys from `frontend/`.

## Commands

All commands run from the `frontend/` directory:

```bash
cd frontend
npm run dev      # Dev server on port 3001
npm run build    # Production build
npm run start    # Production server on port 3001
npm run lint     # ESLint via Next.js
```

No test framework is configured.

## Architecture

**Next.js 14 App Router** dashboard tracking AI developments in Canada. React 19, Tailwind CSS 4, TypeScript.

### Routes (`frontend/src/app/`)
- `/dashboard` — Main dashboard (orchestrator: `DashboardPage`)
- `/methodology` — Methodology explainer
- `/insights` — Insights page
- `/` — Redirects to `/dashboard`
- `/api/v1/*` — 17 REST API routes (stories, trends, stocks, jobs, parliament, arxiv, etc.)

### Data Flow
```
External API → Client Library (frontend/src/lib/*-client.ts)
             → unstable_cache (6–12h revalidation)
             → API Route (/api/v1/*)
             → usePolling hook (2min interval, pauses when tab hidden)
             → Component render
```

Each data source has its own client library in `lib/` (23 total). All use Next.js `unstable_cache` for server-side caching with graceful fallbacks to static/mock data on failure.

### AI Enrichment Pipeline
`summarizer.ts` calls OpenAI (gpt-5-nano/mini) for content summarization. Results are cached in Vercel KV via `ai-enrichment-cache.ts`. The `dashboard-enrichment.ts` module orchestrates story enrichment before serving to the client.

### Components (`frontend/src/components/`)
36 components. Section components (e.g., `StoryFeed`, `IndicatorsSection`, `TrendsInsightsSection`) each own their data fetching via `usePolling`. Chart components use ECharts via `echarts-for-react` with **dynamic imports** (`ssr: false`).

### Hooks (`frontend/src/hooks/`)
- `usePolling` — Generic polling with visibility detection (pauses when tab hidden), configurable interval and transform function
- `useChartTheme` — Observes `data-theme` attribute via MutationObserver, returns light/dark ECharts theme object

## Theming

Light/dark mode uses **CSS custom variables** on `[data-theme="dark"]`, not Tailwind's dark mode. The toggle persists to `localStorage("theme")`. An inline script in `layout.tsx` reads localStorage before hydration to prevent flash.

Key variables: `--bg-page`, `--surface-primary`, `--text-primary`, `--accent-primary`, `--border-subtle`, `--shadow-soft`.

Fonts: **Manrope** (UI, `--font-ui`) and **Fraunces** (display headings, `--font-display`) loaded via `next/font/google`.

## Environment Variables

Required in `frontend/.env.local`:
- `GITHUB_TOKEN` — GitHub API access
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Vercel KV store
- `CRON_SECRET` — Authenticates the daily `/api/v1/ai-refresh` cron job

## Cron

`frontend/vercel.json` configures a daily cron at 12:00 UTC hitting `/api/v1/ai-refresh` for automated data refresh.

## Key Patterns

- **Path alias**: `@/*` maps to `frontend/src/*`
- **Card styles**: `.saas-card` and `.glass-card` classes in `globals.css` provide frosted glass effects
- **ECharts**: Always dynamically imported with `ssr: false`. Use SVG renderer. Theme colors come from `useChartTheme`
- **Sentiment/category**: Regex-based classification in `rss-client.ts` (`classifySentiment`, `assignCategory`)
- **Timeouts**: External API clients use 15–30s timeouts with try/catch fallbacks
