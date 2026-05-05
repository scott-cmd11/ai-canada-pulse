# Live AI Adoption Source Expansion

- [x] Create isolated worktree and review current deployed frontend surface.
- [x] Add live Statistics Canada AI adoption client and API route.
- [x] Replace/downgrade static adoption data with source-linked fallback metadata.
- [x] Add dynamic Government of Canada AI Register ingestion through Open Canada CKAN.
- [x] Add CanadaBuys procurement demand signals and contracts source health.
- [x] Update dashboard sections to prioritize adoption metrics, public-sector AI register, and procurement demand.
- [x] Update source registry, methodology, about page, and sitemap accuracy.
- [x] Add lightweight source-health fields to public status.
- [x] Run lint, build, and local route checks.

## Review

- Added official StatCan AI adoption live fetches for actual use, planned use, employment impact, and operational changes, with table IDs, source URLs, fetch times, and fallback status.
- Added dynamic Open Canada CKAN discovery for the Government of Canada AI Register CSV and source-linked register summaries.
- Added CanadaBuys and contracts-over-$10,000 demand-signal ingestion, labelled as procurement demand rather than adoption rate evidence.
- Updated dashboard, regulatory, source registry, methodology, about, sitemap, public status, and adoption fallback surfaces.
- Verified fixture checks, production build, live local routes, and forced fallback source-health labels. `npm run lint` remains blocked by the repository's interactive Next ESLint setup prompt.

## Follow-up Review Pass

- [x] Corrected the AI Register API route so Next treats it as dynamic instead of statically generated.
- [x] Added adoption-source health to the dashboard operational status strip.
- [x] Cleaned visible methodology encoding issues and clarified funding threshold wording.
- [x] Re-ran fixture checks, production build, and built-app route smoke tests.

## Quality Gate Pass

- [x] Added a non-interactive Next ESLint configuration and installed the matching lint dependencies.
- [x] Fixed lint-reported hook order issues in `EcosystemSection` and `StoryFeed`.
- [x] Escaped JSX text in Parliament and Epoch AI sections instead of suppressing lint rules.
- [x] Removed stale TypeScript ESLint disable comments from Google Trends clients.
- [x] Hardened startup signal parsing for missing upstream fields and marked `/api/v1/startups` dynamic.
- [x] Verified `npm run lint`, `npm run check:adoption-sources`, `npm run build`, and built-app route smoke checks.

## Dashboard Hierarchy Pass

- [x] Verified the rendered dashboard with Playwright and a full-page screenshot.
- [x] Promoted the adoption monitor to a top-level dashboard section immediately after the hero/navigation.
- [x] Ordered the adoption section by evidence quality: official StatCan metrics, Government of Canada AI Register, then procurement demand.
- [x] Removed duplicate AI Register and procurement content from the regulatory drawer.
- [x] Updated the section navigation and hero CTA so adoption is the primary path.
- [x] Verified lint, adoption fixture checks, clean production build, Playwright screenshot, and built-app route smoke checks.

## Methodology Trust Pass

- [x] Added explicit `sourceStatus` metadata to every source: live, mixed, or curated.
- [x] Added explicit `evidenceRole` metadata to every source: adoption rate, public-sector system, demand signal, proxy signal, context, or source feed.
- [x] Updated the methodology source table to show status and role on desktop and mobile.
- [x] Updated source attribution to show the evidence role next to the linked source.
- [x] Cleaned remaining mojibake in source attribution.
- [x] Verified lint, adoption fixture checks, production build, and built-app smoke checks for `/methodology`, `/dashboard`, and `/api/v1/public-status`.

## Metadata Accuracy Pass

- [x] Removed stale `17+ public data sources` metadata claims.
- [x] Updated root metadata to use the live source registry count and adoption-monitor positioning.
- [x] Updated dashboard metadata to foreground official adoption metrics, AI Register evidence, procurement demand, and labelled proxy signals.
- [x] Scanned `frontend/src` for remaining `17+`, mojibake, and stale metadata claims.
- [x] Verified lint, adoption fixture checks, production build, and built-app smoke checks for `/dashboard`, `/about`, and `/methodology`.

## Source Guardrail Pass

- [x] Added `scripts/check-source-registry.mjs` to validate source ids, source status, evidence roles, and stale public copy.
- [x] Guarded against mislabelling proxy, procurement, or private signals as direct adoption rates.
- [x] Added `npm run check:source-registry` and `npm run check:sources`.
- [x] Verified `npm run check:source-registry`, `npm run check:sources`, `npm run lint`, and `npm run build`.

## Build Noise Cleanup Pass

- [x] Marked `/api/v1/events` as dynamic so Next does not probe it during static generation.
- [x] Cleaned the events client header comment into plain ASCII.
- [x] Verified `npm.cmd run check:sources`, `npm.cmd run lint`, and `npm.cmd run build`.
- [x] Confirmed the production build now lists `/api/v1/events` as dynamic and no longer logs the previous dynamic-server warning for that route.

## Redis Import Cleanup Pass

- [x] Replaced import-time Upstash Redis clients in deep-dive, Job Bank, section summary, and AI refresh modules with lazy environment-guarded clients.
- [x] Preserved production cache/write behaviour when Redis credentials are present.
- [x] Kept local/dev fallback behaviour quiet when Redis credentials are absent.
- [x] Verified `npm.cmd run check:sources`, `npm.cmd run lint`, and `npm.cmd run build`.
- [x] Confirmed the production build no longer emits the previous Upstash missing URL/token warnings.

## Dynamic Route Hygiene Pass

- [x] Marked quote-admin, legislation, and parliament API routes as dynamic so build-time static probes do not run auth/live-source logic.
- [x] Verified `npm.cmd run check:sources`, `npm.cmd run lint`, and `npm.cmd run build`.
- [x] Confirmed the production build no longer emits the previous quote-admin `CRON_SECRET` warnings or LegisInfo fallback probe warning.

## Completion Audit Pass

- [x] Strengthened `check-adoption-sources` so it verifies all four official StatCan table IDs, source URL PIDs, the AI Register CKAN package, and procurement source IDs.
- [x] Strengthened `check-source-registry` so it also blocks prohibited `@vercel/kv` and `@vercel/postgres` dependencies.
- [x] Removed unused `@vercel/kv` and `redis` dependencies from the frontend package.
- [x] Made the lint script explicit with `next lint --dir src` after dependency cleanup exposed unstable default lint invocation behaviour.
- [x] Verified `npm.cmd run check:sources`, `npm.cmd run lint`, and `npm.cmd run build`.
- [x] Smoke-checked the built app on port 3011 for `/`, `/dashboard`, `/methodology`, `/about`, `/api/v1/public-status`, `/api/v1/adoption`, `/api/v1/gov-registry`, and `/api/v1/procurement-demand`.
- [x] Fixed forced fallback verification so Next cache cannot mask `AI_CANADA_FORCE_SOURCE_FALLBACK=1`.
- [x] Re-verified fallback status on port 3012 for adoption, AI Register, procurement demand, and public status source-health fields.
- [x] Rewrote the source-registry guardrail's mojibake detector with Unicode escapes so the checker itself stays clean.
- [x] Re-verified `npm.cmd run check:sources`, `npm.cmd run lint`, and `npm.cmd run build`.

## Final Completion Audit

Success criteria for this pass:

- [x] Official adoption metrics come from live, source-linked Statistics Canada AI tables where available.
  - Evidence: `frontend/src/lib/statcan-sdmx-client.ts`, `frontend/src/app/api/v1/adoption/route.ts`, and `npm.cmd run check:sources`.
- [x] Static/private/proxy adoption figures are downgraded or labelled as context instead of direct adoption rates.
  - Evidence: `frontend/src/lib/adoption-data.ts`, `frontend/src/components/AIAdoptionSection.tsx`, `frontend/src/lib/source-registry.ts`, and `frontend/scripts/check-source-registry.mjs`.
- [x] Government of Canada AI Register uses Open Canada CKAN discovery instead of a hardcoded dated CSV.
  - Evidence: `frontend/src/lib/gov-ai-registry-client.ts` and `frontend/scripts/check-adoption-sources.mjs`.
- [x] CanadaBuys and Contracts over $10,000 are added as reviewable demand signals, not adoption-rate claims.
  - Evidence: `frontend/src/lib/procurement-demand-client.ts`, `frontend/src/components/ProcurementDemandSection.tsx`, and `frontend/src/lib/source-registry.ts`.
- [x] Dashboard hierarchy is official adoption first, public-sector system inventory second, procurement demand third, and proxy indicators downstream.
  - Evidence: `frontend/src/app/dashboard/page.tsx`, `frontend/src/components/SectionNav.tsx`, and `frontend/src/components/RegulatorySection.tsx`.
- [x] `/methodology`, `/about`, metadata, sitemap, and public status match the real implementation.
  - Evidence: `frontend/src/app/methodology/page.tsx`, `frontend/src/app/about/page.tsx`, `frontend/src/app/layout.tsx`, `frontend/src/app/sitemap.ts`, and `frontend/src/app/api/v1/public-status/route.ts`.
- [x] Source health exposes live/fallback status and forced fallback cannot be hidden by cached live responses.
  - Evidence: cache-bypass wrappers in StatCan, AI Register, and procurement clients plus port 3012 forced-fallback route check.
- [x] Verification covers source integrity, lint, build, fallback behaviour, route availability, and diff hygiene.
  - Evidence: `npm.cmd run check:sources`, `npm.cmd run lint`, `npm.cmd run build`, built-route smoke checks, forced-fallback checks, and `git diff --check`.
