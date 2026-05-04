# Local WIP Cleanup Inventory - 2026-05-03

This inventory was taken from `C:\Users\scott\coding projects\ai-canada-pulse`.
That checkout is on local `main`, which is 218 commits behind `origin/main` and
contains a large mixed working tree. Do not push it directly to `main`.

## Immediate Safe State

- Current clean repair work is on `codex/fix-ai-refresh-scheduler`.
- Current PR: https://github.com/scott-cmd11/ai-canada-pulse/pull/3
- The PR is based on current `origin/main` and avoids the stale local checkout.

## Keep / Review Carefully

These look like product work and should be replayed onto a fresh branch from
`origin/main` in focused batches:

- Root dashboard/API changes under `app/`, `components/dashboard-page.tsx`, `components/dashboard/`, `lib/`, `messages/`, and `workers/`.
- Backend changes under `backend/app/` plus `backend/alembic/versions/20260313_0006_add_source_and_attributes.py`.
- Frontend dashboard redesign changes under `frontend/src/app/dashboard/` and `frontend/src/components/`.
- New dashboard support files: `app/api/v1/proxy/`, `app/styles/`, `lib/scope.ts`, and the new dashboard components.
- New tests under `backend/tests/`.

## Likely Generated / Do Not Push As Product Code

These should be deleted or archived outside the repo before any broad commit:

- `.playwright-mcp/`
- `.tmp.driveupload/`
- `.venv/`
- `dashboard-live-stale-check.yml`
- Screenshot/design artifact PNGs in the repo root, including `about-polish.png`, `blog-design-*.png`, `dashboard-*.png`, `home-*.png`, `live-*.png`, `methods-*.png`, `mobile-*.png`, `preview-*.png`, and `topics-polish.png`.

## Superseded / Needs Diff Against Origin

- `.github/workflows/ai-refresh-scheduler.yml` exists only in the stale local checkout; PR #3 restores the workflow on a current branch.
- `frontend/vercel.json` on `origin/main` already contains the active Vercel cron setup and deploy guard.
- Root-level `package.json`, `package-lock.json`, `next.config.mjs`, and `tailwind.config.ts` are risky because the current remote app is under `frontend/`; diff these before carrying anything forward.

## Recommended Cleanup Sequence

1. Merge PR #3 after review.
2. Create a fresh branch from current `origin/main` for each workstream.
3. Replay only reviewed changes from the stale local checkout using explicit file paths.
4. Run `npm run build` from `frontend/` and the relevant backend tests before each PR.
5. After useful work is recovered, archive or delete generated artifacts from the stale checkout.
