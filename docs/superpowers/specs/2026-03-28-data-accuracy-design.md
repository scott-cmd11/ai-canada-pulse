# Data Accuracy & Factual Verification — Design Spec

**Date:** 2026-03-28
**Project:** AI Canada Pulse
**Scope:** All pages and data sources on the site

---

## Goal

Ensure every piece of information displayed on the site is factual, accurate, and clearly sourced. This covers both live API-fed data and manually curated static datasets.

---

## Approach: Full Audit (Option C)

Three sequential phases:

1. **Static data audit** — verify and update the 4 hardcoded datasets
2. **Live API spot-check** — verify endpoint correctness and data interpretation for the 23 API routes
3. **Methodology page update** — fix known errors and bring written claims in sync with reality

---

## Phase 1 — Static Data Audit

### Files to audit (all 4 can be done in parallel)

| File | Records | Authoritative Sources |
|---|---|---|
| `frontend/src/lib/startups-data.ts` | 41 startups | Company websites, Crunchbase, LinkedIn |
| `frontend/src/lib/university-programs-data.ts` | 30 programs | University calendar/website pages |
| `frontend/src/lib/provinces-config.ts` | 13 provinces/territories | Stats Canada Census, university websites |
| `frontend/src/lib/events-data.ts` | 16 events | Event official websites |

### What to verify per file

**startups-data.ts:**
- Company still active (not acquired, shut down, or rebranded)?
- Funding stage still current?
- Description accurate and not outdated?
- Location correct?
- URL still valid?

**university-programs-data.ts:**
- Program still offered at the institution?
- Degree type correct (BSc/MSc/PhD/Certificate/Diploma)?
- Notable features (Hinton, Bengio, Sutton references) still accurate — these people may have moved institutions?
- URL still valid?

**provinces-config.ts:**
- Population figures from Stats Canada 2021 Census (or 2026 preliminary if available)?
- Institution names spelled correctly and still active?
- Province/territory descriptions factually accurate (no misleading claims)?

**events-data.ts:**
- Event dates in the future — remove any past events?
- Location correct?
- Event still confirmed (not cancelled)?
- URL valid?

### Code changes

1. **Update stale/incorrect records** in each file based on verification findings
2. **Add `lastVerified` field** (ISO date string) to each record:
   ```ts
   {
     name: "Cohere",
     lastVerified: "2026-03-28",
     // ...existing fields
   }
   ```
3. **Add a top-level comment block** to each file:
   ```ts
   /**
    * Last audited: 2026-03-28
    * Sources: [list authoritative sources used]
    * Next review recommended: 2026-09-28 (6 months)
    */
   ```

---

## Phase 2 — Live API Spot-Check

All 23 routes verified (`ai-refresh` is an orchestration/cron trigger, not a data source, and is excluded).

### High-priority routes (interpretation risk)

| Route | Source | What to verify |
|---|---|---|
| `/api/v1/indicators` | Statistics Canada | Table IDs correct for unemployment, CPI, GDP? Vector/member IDs mapping to right series? |
| `/api/v1/immigration` | IRCC / Open Canada | CKAN dataset ID current? Field names correctly map to tech worker permit counts? |
| `/api/v1/nserc` | Open Canada CKAN | Dataset ID current? AI-related grant filter logic correct? |
| `/api/v1/oecd` | OECD Stats | Right indicator for Canada AI investment comparison? |
| `/api/v1/parliament` | LEGISinfo | AI keyword filter capturing relevant mentions without over/under-filtering? |
| `/api/v1/legislation` | LEGISinfo | Bill C-27 status current? Other tracked bills correct? |

### Lower-priority routes (sanity check — verify endpoint live + data shape correct)

arxiv, compute-status, epoch-models, events, github, gov-registry, huggingface, jobs, privacy, research, sentiment, startups, stocks, stories, trends, trends-regional

### Code changes

1. **Fix any wrong table IDs, field mappings, or filter logic** found during verification
2. **Add inline source comments** to client lib files where missing:
   ```ts
   // Stats Canada Table 14-10-0287-03 — Labour Force Survey, monthly
   ```
3. No architectural changes — targeted fixes only

---

## Phase 3 — Methodology Page Fixes

**File:** `frontend/src/app/methodology/page.tsx`

The methodology page already uses `{SOURCES.length}` from `source-registry.ts` for the source count (dynamic, not hardcoded), and renders a data sources table dynamically. Focus is on known errors and missing disclosures.

### Known errors to fix

1. **`gpt-5-mini` on line 321** — referenced as the model for the "Canada executive brief". Verify this against the actual default in `summarizer.ts` (`OPENAI_BRIEF_MODEL`). Fix the methodology page to match what's actually in use.

2. **`gpt-5-nano` in summarizer.ts** — verify both `OPENAI_ARTICLE_MODEL` (`gpt-5-nano`) and `OPENAI_BRIEF_MODEL` (`gpt-5-mini`) default values are valid, currently-supported OpenAI model names. Update if not.

### Additions

3. **Add a "Manually Curated Data" section** — explicitly disclose that startups, university programs, and province profiles are manually curated. Surface the `lastVerified` dates added in Phase 1 so readers know when data was last checked.

4. **Verify `source-registry.ts` entries** — confirm each entry in `frontend/src/lib/source-registry.ts` maps to an actual live API route. Remove or update any stale entries for endpoints that no longer exist.

### Design constraints
- Page layout/design unchanged — content updates only
- Match existing typography and component patterns

---

## Execution Order

```
Phase 1 (4 agents in parallel, one per static file)
  → Phase 2 (2 agents in parallel: high-priority routes + sanity-check batch)
    → Phase 3 (depends on Phase 1 lastVerified dates + Phase 2 API findings)
```

---

## Success Criteria

- [ ] All 41 startups verified as active/current or updated/removed
- [ ] All 30 university programs verified as still offered or updated/removed
- [ ] All 13 province/territory records verified against Stats Canada
- [ ] All 16 events verified as future/active or removed
- [ ] `lastVerified` timestamps added to all static records
- [ ] All 6 high-priority API routes verified (correct endpoints + field mappings)
- [ ] All lower-priority API routes sanity-checked
- [ ] `gpt-5-mini` / `gpt-5-nano` model names verified and corrected if needed
- [ ] `source-registry.ts` entries verified against actual live routes
- [ ] "Manually Curated Data" section added to methodology page
- [ ] No hardcoded claims remain unverified
