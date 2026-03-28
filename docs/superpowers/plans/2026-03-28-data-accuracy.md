# Data Accuracy & Factual Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify every factual claim on the site against authoritative sources, fix stale records, add `lastVerified` timestamps, and correct known errors on the methodology page.

**Architecture:** Three sequential phases. Phase 1 audits the 4 hardcoded static data files using web search, updates stale records, and adds `lastVerified` fields. Phase 2 spot-checks all 23 live API routes for correct endpoints and data interpretation. Phase 3 fixes known errors on the methodology page and adds a manually curated data disclosure section.

**Tech Stack:** TypeScript (Next.js 14), web search for fact verification, `npm run build` for TypeScript validation.

---

## File Map

| File | Phase | Change Type |
|---|---|---|
| `frontend/src/lib/startups-data.ts` | 1 | Add `lastVerified` to interface + all records; update stale data |
| `frontend/src/lib/university-programs-data.ts` | 1 | Add `lastVerified` to interface + all records; update stale data |
| `frontend/src/lib/events-data.ts` | 1 | Add `lastVerified` to interface + all records; remove past events |
| `frontend/src/lib/provinces-config.ts` | 1 | Add `lastVerified` to interface + all records; verify populations |
| `frontend/src/lib/indicators-data.ts` | 2 | Add source comments; fix table IDs if wrong |
| `frontend/src/lib/ircc-client.ts` | 2 | Add source comments; fix dataset IDs if wrong |
| `frontend/src/lib/nserc-client.ts` | 2 | Add source comments; verify dataset ID |
| `frontend/src/lib/oecd-client.ts` | 2 | Add source comments; verify indicator mapping |
| `frontend/src/lib/parliament-client.ts` | 2 | Add source comments; verify keyword filter |
| `frontend/src/lib/legisinfo-client.ts` | 2 | Add source comments; verify bill tracking |
| `frontend/src/lib/summarizer.ts` | 3 | Fix model name defaults if invalid |
| `frontend/src/lib/source-registry.ts` | 3 | Remove/update stale entries |
| `frontend/src/app/methodology/page.tsx` | 3 | Fix gpt-5-mini reference; add curated data section |

---

## Phase 1 — Static Data Audit

### Task 1: Add `lastVerified` to TypeScript interfaces

This must be done first so later tasks can add the field to records without TypeScript errors.

**Files:**
- Modify: `frontend/src/lib/startups-data.ts`
- Modify: `frontend/src/lib/university-programs-data.ts`
- Modify: `frontend/src/lib/events-data.ts`
- Modify: `frontend/src/lib/provinces-config.ts`

- [ ] **Step 1: Add `lastVerified` to `CanadianStartup` interface**

In `startups-data.ts`, add to the `CanadianStartup` interface:
```ts
export interface CanadianStartup {
  name: string
  city: string
  province: string
  provinceSlug: string
  sector: StartupSector
  stage: FundingStage
  foundedYear: number
  url: string
  description: string
  lastVerified: string  // ISO date, e.g. "2026-03-28"
}
```

- [ ] **Step 2: Add `lastVerified` to `UniversityProgram` interface**

In `university-programs-data.ts`:
```ts
export interface UniversityProgram {
  institution: string
  program: string
  degree: "BSc" | "MSc" | "PhD" | "Certificate" | "Diploma"
  province: string
  provinceSlug: string
  url: string
  notable?: string
  lastVerified: string
}
```

- [ ] **Step 3: Add `lastVerified` to `AIEvent` interface**

In `events-data.ts`:
```ts
export interface AIEvent {
  id: string
  name: string
  date: string
  endDate?: string
  city: string
  province: string
  provinceSlug: string
  type: EventType
  organizer: string
  url: string
  description: string
  recurring?: boolean
  lastVerified: string
}
```

- [ ] **Step 4: Add `lastVerified` to `ProvinceConfig` interface**

In `provinces-config.ts`:
```ts
export interface ProvinceConfig {
  slug: string
  name: string
  abbreviation: string
  capital: string
  population: number
  description: string
  googleTrendsGeo: string
  institutions: InstitutionConfig[]
  sections: ProvinceSections
  neighborSlugs: string[]
  subRegions?: string[]
  lastVerified: string
}
```

- [ ] **Step 5: Run build to confirm TypeScript errors (expected — records don't have the field yet)**

Run from `frontend/`:
```bash
npm run build 2>&1 | grep "lastVerified" | head -20
```
Expected: TypeScript errors about missing `lastVerified` on each record — confirms the interface change worked.

---

### Task 2: Audit and update `startups-data.ts`

41 Canadian AI startups. Verify each one is still active, correctly described, and properly staged.

**Files:**
- Modify: `frontend/src/lib/startups-data.ts`

- [ ] **Step 1: Read the full file**

Read `frontend/src/lib/startups-data.ts` to see all 41 records.

- [ ] **Step 2: Research each startup against authoritative sources**

For each startup, use web search to verify:
- Is the company still operating (not acquired, shut down, or renamed)?
- Is the funding stage still current? (e.g., a Series A company may have raised Series B)
- Is the description still accurate?
- Is the URL still valid?

Key sources to check:
- Company website directly
- Crunchbase profile: `https://www.crunchbase.com/organization/<company-name>`
- Recent news: search `"<company name>" Canada AI 2025 2026`

Companies most likely to have changed status (high-growth or announced):
- Cohere (IPO speculation, large growth rounds)
- Ada (rebranded from Ada Support)
- Sanctuary AI (robotics, acquisition risk)
- Waabi (autonomous trucking, funding rounds)
- Layer 6 (acquired by TD Bank — should be marked Acquired)

- [ ] **Step 3: Update stale records and add `lastVerified: "2026-03-28"` to all 41 records**

For any record found to be stale:
- If acquired: update `stage: "Acquired"`, update description to note acquirer
- If rebranded: update `name` and `url`
- If wrong funding stage: update `stage`
- If description outdated: update `description`

Add `lastVerified: "2026-03-28"` to every record regardless.

Update the top comment block:
```ts
/**
 * Last audited: 2026-03-28
 * Sources: Crunchbase, BetaKit, company websites
 * Next review recommended: 2026-09-28 (6 months)
 */
```

- [ ] **Step 4: Run build to confirm no TypeScript errors**

```bash
cd frontend && npm run build 2>&1 | grep -E "error|warn" | grep "startups" | head -10
```
Expected: No errors related to startups-data.ts.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/startups-data.ts
git commit -m "data: verify and update Canadian AI startups dataset (March 2026)"
```

---

### Task 3: Audit and update `university-programs-data.ts`

30 AI university programs across Canada. Verify they're still offered and researcher attributions are current.

**Files:**
- Modify: `frontend/src/lib/university-programs-data.ts`

- [ ] **Step 1: Read the full file**

Read `frontend/src/lib/university-programs-data.ts`.

- [ ] **Step 2: Verify notable researcher attributions**

The most important factual claims to verify are the `notable` fields referencing specific researchers:
- `"Hinton's home department"` at U of T — Geoffrey Hinton retired from Google in 2023; he is still affiliated with U of T as emeritus professor. Verify current status.
- `"Yoshua Bengio's department"` at UdeM — Bengio is still active at Mila/UdeM. Verify still current.
- `"Richard Sutton"` references at U of Alberta — Sutton left U of Alberta for industry (Google DeepMind). Verify his current status and update if needed.

Search: `"Geoffrey Hinton" "University of Toronto" 2025 2026`
Search: `"Yoshua Bengio" "Université de Montréal" 2025 2026`
Search: `"Richard Sutton" "University of Alberta" 2025 2026`

- [ ] **Step 3: Verify program URLs are live**

For any program with a `notable` field or specific URL, verify the URL still resolves to the right page. Programs most likely to have changed:
- Any program with year-specific URLs
- Certificate/Diploma programs (shorter tenure, more likely discontinued)

- [ ] **Step 4: Update stale records and add `lastVerified: "2026-03-28"` to all 30 records**

For any stale `notable` field, update the text to reflect current status.
Add `lastVerified: "2026-03-28"` to every record.

Update top comment:
```ts
/**
 * Last audited: 2026-03-28
 * Sources: University program pages, CIFAR reports
 * Next review recommended: 2026-09-28 (6 months)
 */
```

- [ ] **Step 5: Run build and commit**

```bash
cd frontend && npm run build 2>&1 | grep "programs" | head -5
git add frontend/src/lib/university-programs-data.ts
git commit -m "data: verify university AI programs and researcher attributions (March 2026)"
```

---

### Task 4: Audit and update `events-data.ts`

16 AI events. Verify dates are in the future, events are confirmed, and details are accurate.

**Files:**
- Modify: `frontend/src/lib/events-data.ts`

- [ ] **Step 1: Read the full file**

Read `frontend/src/lib/events-data.ts`.

- [ ] **Step 2: Check each event date against today (2026-03-28)**

Remove any events with `date` before `2026-03-28`. Today's date is 2026-03-28.

- [ ] **Step 3: Verify upcoming events are confirmed**

For each event with a future date, search to confirm it's actually happening:
```
"<event name>" 2026 dates confirmed
```

Key events to verify:
- NeurIPS 2026 — major conference, should be confirmed by now
- ICML 2026 — major conference
- Any government consultation events (these get cancelled/rescheduled frequently)

- [ ] **Step 4: Update and add `lastVerified: "2026-03-28"` to all remaining records**

Remove past events entirely (don't mark them — just delete the object from the array).
Add `lastVerified: "2026-03-28"` to each remaining event.

Update top comment:
```ts
/**
 * Last audited: 2026-03-28
 * Sources: Conference websites, Mila/Vector event pages
 * Next review recommended: 2026-06-28 (3 months — events change frequently)
 */
```

- [ ] **Step 5: Run build and commit**

```bash
cd frontend && npm run build 2>&1 | grep "events" | head -5
git add frontend/src/lib/events-data.ts
git commit -m "data: remove past events, verify upcoming AI events (March 2026)"
```

---

### Task 5: Audit and update `provinces-config.ts`

13 province/territory records. Verify populations, institution names, and descriptions.

**Files:**
- Modify: `frontend/src/lib/provinces-config.ts`

- [ ] **Step 1: Read the full file**

Read `frontend/src/lib/provinces-config.ts`.

- [ ] **Step 2: Verify population figures against Stats Canada**

Search: `"Statistics Canada" population province 2024 2025 estimates`
Or check: `https://www150.statcan.gc.ca/n1/pub/71-607-x/2018005/pop-eng.htm`

Current figures in the file (verify each):
- Ontario: 15.8M
- Quebec: 9.0M
- British Columbia: 5.6M
- Alberta: 4.7M
- (and remaining provinces/territories)

Update any figures that are off by more than ~0.2M from the latest Stats Canada estimates.

- [ ] **Step 3: Verify institution names and URLs**

For each province's `institutions` array, verify:
- Institution name is spelled correctly
- Institution is still active (not merged/renamed)
- URL is still valid

Key institutions to verify:
- Vector Institute (Toronto) — still operating
- Mila (Montreal) — still operating
- Amii (Edmonton) — still operating
- CIFAR — still operating
- Scale AI (Montreal hub) — verify status

- [ ] **Step 4: Verify province descriptions for factual accuracy**

Read each `description` field. Flag any claims that could be misleading:
- Superlatives ("home to the most...") — are they still true?
- References to specific initiatives or funding rounds
- Claims about "Canada's only" or "first" anything

- [ ] **Step 5: Update stale records and add `lastVerified: "2026-03-28"` to all 13 records**

Update the top comment:
```ts
/**
 * Last audited: 2026-03-28
 * Sources: Stats Canada Q4 2025 population estimates, institutional websites
 * Next review recommended: 2027-03-28 (12 months — provinces change slowly)
 */
```

- [ ] **Step 6: Run build and commit**

```bash
cd frontend && npm run build 2>&1 | grep "provinces" | head -5
git add frontend/src/lib/provinces-config.ts
git commit -m "data: verify province populations, institutions, and descriptions (March 2026)"
```

---

### Task 6: Final Phase 1 build check

- [ ] **Step 1: Run full build to confirm all static data files compile cleanly**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` with no TypeScript errors.

---

## Phase 2 — Live API Spot-Check

### Task 7: Audit high-priority API routes

These 6 routes have the highest risk of misinterpretation — they pull structured data from government sources where field names and dataset IDs can change.

**Files:**
- Modify: `frontend/src/lib/indicators-client.ts`
- Modify: `frontend/src/lib/immigration-client.ts`
- Modify: `frontend/src/lib/nserc-client.ts`
- Modify: `frontend/src/lib/oecd-client.ts`
- Modify: `frontend/src/lib/parliament-client.ts`
- Modify: `frontend/src/lib/legislation-client.ts`

- [ ] **Step 1: Audit `indicators-data.ts` — Statistics Canada**

Read `frontend/src/lib/indicators-data.ts`. Find the Statistics Canada table IDs being used.

Verify each table ID against Stats Canada's API:
- Unemployment rate: should be from table `14-10-0287-01` (Labour Force Survey) or similar
- CPI: should be from table `18-10-0004-01`
- GDP: should be from table `36-10-0104-01`

Check: `https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=<TABLE_ID_WITHOUT_DASHES>`

If any table ID is wrong, update the constant. Add source comments above each table ID:
```ts
// Stats Canada Table 14-10-0287-01 — Labour Force Survey, unemployment rate
const UNEMPLOYMENT_TABLE = "14-10-0287-01"
```

- [ ] **Step 2: Audit `ircc-client.ts` — IRCC/Open Canada**

Read `frontend/src/lib/ircc-client.ts`. Find the CKAN dataset URL or resource ID being used.

Verify the dataset is still the right one for tech work permits:
Search: `site:open.canada.ca "temporary foreign worker" OR "LMIA" dataset`
Or check: `https://open.canada.ca/data/en/dataset`

Add source comment:
```ts
// Open Canada dataset: Temporary Foreign Worker Program — LMIA-exempt work permits
// https://open.canada.ca/data/en/dataset/<dataset-id>
```

- [ ] **Step 3: Audit `nserc-client.ts` — NSERC grants**

Read the file. Verify the Open Canada CKAN dataset ID for NSERC AI grants is current.
Check: `https://open.canada.ca/data/en/dataset` — search for "NSERC"

Verify the keyword filter used to classify grants as "AI-related" makes sense. Are terms like "machine learning", "neural network", "artificial intelligence" in the filter? Any obvious gaps?

- [ ] **Step 4: Audit `oecd-client.ts` — OECD AI data**

Read the file. Identify what OECD indicator is being pulled for Canada.
Verify on OECD's AI Policy Observatory: `https://oecd.ai/en/data`

Confirm the indicator label shown in the UI matches what the data actually represents. Add source comment:
```ts
// OECD.AI Policy Observatory — AI investment as % of GDP, Canada comparison
// https://oecd.ai/en/data?selectedArea=investments-in-ai
```

- [ ] **Step 5: Audit `parliament-client.ts` — Parliament mentions**

Read the file. Find the keyword list used to identify AI-related parliamentary mentions.

Evaluate the keyword list:
- Does it include "artificial intelligence", "machine learning", "algorithmic"?
- Does it include French equivalents (this is a bilingual parliament)?
- Are there obvious false positives (e.g., "intelligence" alone would match too broadly)?

If the filter needs tightening or expanding, update it and note the rationale in a comment.

- [ ] **Step 6: Audit `legisinfo-client.ts` — Bill tracking**

Read `frontend/src/lib/legisinfo-client.ts`. Find which bills are being tracked.

Verify Bill C-27 (Artificial Intelligence and Data Act) current status:
Search: `"Bill C-27" Canada 2025 2026 status`

As of March 2026, C-27 died on the order paper when Parliament was prorogued. Verify the status shown in the UI reflects this correctly.

Check if any other AI bills should be tracked (search: `Canada parliament AI bill 2025 2026`).

- [ ] **Step 7: Commit any fixes found**

```bash
git add frontend/src/lib/indicators-data.ts frontend/src/lib/ircc-client.ts \
  frontend/src/lib/nserc-client.ts frontend/src/lib/oecd-client.ts \
  frontend/src/lib/parliament-client.ts frontend/src/lib/legisinfo-client.ts
git commit -m "data: verify and annotate high-priority API route data sources"
```

---

### Task 8: Sanity-check lower-priority API routes

16 lower-priority routes. Quick check that each is live and returning expected data shape.

**Files:**
- Modify (if issues found): relevant client lib files in `frontend/src/lib/`

- [ ] **Step 1: Read each client lib for the lower-priority routes**

Read these files in sequence (all exist in `frontend/src/lib/`):
- `arxiv-client.ts` — should call `export.arxiv.org` API
- `github-client.ts` — should call `api.github.com`
- `huggingface-client.ts` — should call `huggingface.co/api`
- `jobs-client.ts` — should call Indeed RSS
- `stocks-client.ts` — should call a stock data API
- `research-client.ts` — check data source
- `rss-client.ts` — check RSS feeds used for stories/sentiment
- `gov-ai-registry-client.ts` — should call Canada's AI registry
- `opc-client.ts` — should call OPC decisions feed
- `alliance-client.ts` — check compute alliance status source
- `epoch-client.ts` — check METR/Epoch AI source
- `trends-client.ts` — check Google Trends source
- `trends-regional-client.ts` — check regional trends source
- `startup-signals-client.ts` — check startup signals source
- `statcan-sdmx-client.ts` / `statscan-client.ts` — verify which is active
- `gdelt-client.ts` — check if still used (sentiment route comments say GDELT is unavailable)

For each: confirm the endpoint URL looks correct and the response field mappings make sense. Flag anything that looks wrong.

- [ ] **Step 2: Fix any obvious issues found**

If any client lib is pointing to a dead endpoint, wrong API version, or misinterpreting a field, fix it and add a source comment.

- [ ] **Step 3: Commit if any fixes made**

```bash
git add frontend/src/lib/*-client.ts
git commit -m "data: sanity-check and annotate lower-priority API route sources"
```

---

## Phase 3 — Methodology Page Fixes

### Task 9: Fix model names in summarizer and methodology page

**Files:**
- Modify: `frontend/src/lib/summarizer.ts`
- Modify: `frontend/src/app/methodology/page.tsx`

- [ ] **Step 1: Verify model names in summarizer.ts**

Read `frontend/src/lib/summarizer.ts`. Find:
```ts
const OPENAI_ARTICLE_MODEL = process.env.OPENAI_ARTICLE_MODEL ?? "gpt-5-nano"
const OPENAI_BRIEF_MODEL = process.env.OPENAI_BRIEF_MODEL ?? "gpt-5-mini"
```

Verify whether `gpt-5-nano` and `gpt-5-mini` are valid OpenAI model names as of March 2026.
Search: `OpenAI models list 2026 "gpt-5"`

If invalid, determine the correct replacements:
- For per-item article summaries (cost-sensitive): likely `gpt-4o-mini`
- For dashboard briefs (quality-sensitive): likely `gpt-4o` or `gpt-4o-mini`

Update the defaults if they are wrong.

- [ ] **Step 2: Fix the methodology page reference**

Read `frontend/src/app/methodology/page.tsx` around line 321.

Find the line that mentions `gpt-5-mini` for the executive brief. Update it to match the actual model in `summarizer.ts`:
```tsx
<strong>gpt-4o-mini</strong> — generates the daily Canada executive brief
```
(Use whatever model was confirmed in Step 1.)

- [ ] **Step 3: Build to confirm no errors**

```bash
cd frontend && npm run build 2>&1 | grep -E "error|warn" | grep -i "model\|summar" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/summarizer.ts frontend/src/app/methodology/page.tsx
git commit -m "fix: correct OpenAI model names in summarizer and methodology page"
```

---

### Task 10: Verify source-registry.ts and add curated data disclosure

**Files:**
- Modify: `frontend/src/lib/source-registry.ts`
- Modify: `frontend/src/app/methodology/page.tsx`

- [ ] **Step 1: Read source-registry.ts**

Read `frontend/src/lib/source-registry.ts`. This file contains the `SOURCES` array that powers the methodology page's data sources table.

- [ ] **Step 2: Cross-reference entries against actual API routes**

The actual API routes in `frontend/src/app/api/v1/` are:
`ai-refresh, arxiv, compute-status, epoch-models, events, github, gov-registry, huggingface, immigration, indicators, jobs, legislation, nserc, oecd, parliament, privacy, research, sentiment, startups, stocks, stories, trends, trends-regional`

For each entry in `SOURCES`, confirm:
- The endpoint it references actually exists
- The name/description matches what the route actually does
- The `refreshInterval` reflects the actual cache TTL in the route

Remove or update any entries that don't match reality. Add any missing routes that should be listed.

- [ ] **Step 3: Add "Manually Curated Data" section to methodology page**

Find a good location in `methodology/page.tsx` (after the data sources table section) to add a disclosure section. Match the existing page style.

Add this section (adapt to match existing component patterns on the page):
```tsx
<section>
  <h2>Manually Curated Data</h2>
  <p>
    Some data on this site is maintained by hand rather than pulled automatically.
    These datasets are reviewed periodically and may lag behind real-world changes.
  </p>
  <table>
    <thead>
      <tr>
        <th>Dataset</th>
        <th>Records</th>
        <th>Last Verified</th>
        <th>Review Schedule</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Canadian AI Startups</td>
        <td>41 companies</td>
        <td>March 2026</td>
        <td>Every 6 months</td>
      </tr>
      <tr>
        <td>University AI Programs</td>
        <td>30 programs</td>
        <td>March 2026</td>
        <td>Annually</td>
      </tr>
      <tr>
        <td>Province & Territory Profiles</td>
        <td>13 regions</td>
        <td>March 2026</td>
        <td>Annually</td>
      </tr>
      <tr>
        <td>AI Events & Conferences</td>
        <td>Updated count after Task 4</td>
        <td>March 2026</td>
        <td>Every 3 months</td>
      </tr>
    </tbody>
  </table>
</section>
```

Use the page's existing Tailwind + CSS variable patterns — don't introduce new styles. Look at how the existing limitations section is structured and match it.

- [ ] **Step 4: Build to confirm no TypeScript/JSX errors**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/source-registry.ts frontend/src/app/methodology/page.tsx
git commit -m "feat: add manually curated data disclosure to methodology page"
```

---

## Final Verification

### Task 11: Full build and visual check

- [ ] **Step 1: Run full production build**

```bash
cd frontend && npm run build 2>&1 | tail -30
```
Expected: `✓ Compiled successfully`, all routes listed, no TypeScript errors.

- [ ] **Step 2: Start dev server and check methodology page**

```bash
cd frontend && npm run dev
```

Open `http://localhost:3001/methodology`. Verify:
- The "Manually Curated Data" section appears
- Model names shown match what's in `summarizer.ts`
- Data sources table looks correct

- [ ] **Step 3: Check dashboard renders correctly**

Open `http://localhost:3001/dashboard`. Verify:
- Startups section loads (EcosystemSection)
- University programs section loads (TalentEducationSection)
- Events section loads
- Province cards load (ProvinceIndex)

---

## Success Checklist

- [ ] All 41 startups verified (active/current or updated/removed) + `lastVerified` added
- [ ] All 30 university programs verified + researcher attributions checked + `lastVerified` added
- [ ] All 13 province/territory records verified against Stats Canada + `lastVerified` added
- [ ] All events with past dates removed + remaining verified + `lastVerified` added
- [ ] All 6 high-priority API routes verified with source comments added
- [ ] All 16 lower-priority routes sanity-checked
- [ ] `gpt-5-mini`/`gpt-5-nano` model names corrected if invalid
- [ ] `source-registry.ts` entries cross-referenced with actual routes
- [ ] "Manually Curated Data" section live on methodology page
- [ ] Full production build passes with no TypeScript errors
