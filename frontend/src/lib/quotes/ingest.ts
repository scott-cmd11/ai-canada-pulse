// Ingest orchestrator: fetches candidates from every source in parallel,
// classifies them through OpenAI, and upserts pending rows to Supabase.
//
// Per-source failures are logged and isolated — one bad scraper doesn't
// block the rest.

import { classifyBatch } from "./classifier"
import { insertCandidates } from "./supabase-quotes"
import { fetchFederalHansardCandidates } from "./sources/federal-hansard"
import { fetchCanadaNewsCandidates } from "./sources/canada-news"
import { fetchOntarioHansardCandidates } from "./sources/provincial-hansard-on"
import { fetchQuebecHansardCandidates } from "./sources/provincial-hansard-qc"
import { fetchBritishColumbiaHansardCandidates } from "./sources/provincial-hansard-bc"
import { fetchAlbertaHansardCandidates } from "./sources/provincial-hansard-ab"
import type { RawSourceCandidate } from "./types"

type SourceFn = () => Promise<RawSourceCandidate[]>

const SOURCES: Array<{ name: string; fn: SourceFn }> = [
  { name: "federal_hansard",        fn: fetchFederalHansardCandidates },
  { name: "canada_news",            fn: fetchCanadaNewsCandidates },
  { name: "provincial_hansard_on",  fn: fetchOntarioHansardCandidates },
  { name: "provincial_hansard_qc",  fn: fetchQuebecHansardCandidates },
  { name: "provincial_hansard_bc",  fn: fetchBritishColumbiaHansardCandidates },
  { name: "provincial_hansard_ab",  fn: fetchAlbertaHansardCandidates },
]

export interface IngestReport {
  bySource: Record<string, { raw: number; classified: number; error?: string }>
  totalClassified: number
  totalInserted: number
  startedAt: string
  finishedAt: string
}

export async function runIngest(): Promise<IngestReport> {
  const startedAt = new Date().toISOString()
  const bySource: IngestReport["bySource"] = {}

  const results = await Promise.all(
    SOURCES.map(async ({ name, fn }) => {
      try {
        const raw = await fn()
        return { name, raw, error: undefined as string | undefined }
      } catch (err) {
        console.warn(`[quotes/ingest] source ${name} threw:`, err)
        return { name, raw: [] as RawSourceCandidate[], error: String(err) }
      }
    })
  )

  const allRaw: RawSourceCandidate[] = []
  for (const r of results) {
    bySource[r.name] = { raw: r.raw.length, classified: 0, error: r.error }
    allRaw.push(...r.raw)
  }

  console.log(`[quotes/ingest] ${allRaw.length} raw candidates across ${SOURCES.length} sources`)

  // Classify in parallel with concurrency cap to respect OpenAI rate limits.
  const classified = await classifyBatch(allRaw, 4)

  // Tally classified count per source.
  for (const c of classified) {
    const bucket = bySource[c.source_type]
    if (bucket) bucket.classified += 1
  }

  const totalInserted = await insertCandidates(classified)

  const finishedAt = new Date().toISOString()
  console.log(`[quotes/ingest] classified=${classified.length} inserted=${totalInserted}`)

  return {
    bySource,
    totalClassified: classified.length,
    totalInserted,
    startedAt,
    finishedAt,
  }
}
