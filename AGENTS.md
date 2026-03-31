# AGENTS.md — AI Canada Pulse

Instructions for AI coding agents (Claude Code, Cursor, Copilot, etc.) working in this repository.

## Active Codebase

**The deployed application lives in `frontend/`.**

The root-level `app/`, `components/`, `lib/`, and `messages/` directories are **legacy and not deployed**. Do not edit them. Vercel deploys exclusively from `frontend/`.

## Stack

- **Framework:** Next.js 14, App Router, React 19, TypeScript
- **Styling:** Tailwind CSS 4, CSS custom variables (no Tailwind dark mode — uses `[data-theme="dark"]`)
- **Deployment:** Vercel (auto-deploys from `main` branch)
- **Storage:** Upstash Redis (for AI-generated content cache)
- **Fonts:** Manrope (`--font-ui`) and Fraunces (`--font-display`) via `next/font/google`

## Commands (run from `frontend/`)

```bash
npm run dev      # Dev server on port 3001
npm run build    # Production build — always run before committing
npm run lint     # ESLint
```

## Project Structure

```
frontend/src/
  app/           # Next.js App Router pages and API routes
    api/v1/      # 26 REST API routes (all rate-limited via lib/rate-limit.ts)
    dashboard/   # Main dashboard page
    provinces/   # Province/territory index + [slug] pages
    blog/        # Deep-dive blog listing + [slug] pages
  components/    # 36+ React components
  hooks/         # usePolling, useChartTheme
  lib/           # 23 client libraries (rss-client, digest-client, etc.)
```

## Key Conventions

- All API routes import `checkRateLimit` from `@/lib/rate-limit` as their first guard
- Charts use ECharts via `echarts-for-react` with dynamic imports (`ssr: false`)
- Data fetching uses `unstable_cache` server-side + `usePolling` client-side (2min interval)
- Province configuration is the single source of truth: `frontend/src/lib/provinces-config.ts`
- Canadian English spelling throughout (organised, colour, defence, etc.)

## Environment Variables

Required in `frontend/.env.local`:
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `CRON_SECRET`

## Do Not

- Edit anything outside `frontend/` unless explicitly asked
- Commit `.env*.local` files
- Add `node_modules/` or build artifacts to git
- Use `@vercel/postgres` or `@vercel/kv` (both sunset — project uses Upstash Redis)
- Break Canadian English spelling

## See Also

- `frontend/CLAUDE.md` — additional Claude Code-specific instructions
- `frontend/src/lib/provinces-config.ts` — province/territory data and configuration
- `frontend/src/lib/rate-limit.ts` — rate limiting for all API routes
