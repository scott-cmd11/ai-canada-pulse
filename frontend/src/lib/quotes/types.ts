// Shared types for the Canadian-government AI quotes archive.

export type QuoteSourceType =
  | 'federal_hansard'
  | 'senate'
  | 'canada_news'
  | 'provincial_hansard_on'
  | 'provincial_hansard_qc'
  | 'provincial_hansard_bc'
  | 'provincial_hansard_ab'
  | 'manual'

export type QuoteChamber =
  | 'house'
  | 'senate'
  | 'provincial_legislature'
  | 'executive'

export type QuoteJurisdiction = 'federal' | 'on' | 'qc' | 'bc' | 'ab'

export type QuoteStatus = 'pending' | 'approved' | 'rejected'

export type QuoteLanguage = 'en' | 'fr'

/** Canonical quote record — matches the `quotes` Supabase table 1:1. */
export interface Quote {
  id: string
  source_type: QuoteSourceType
  source_url: string | null
  source_fetched_at: string
  speaker_name: string
  speaker_role: string | null
  party: string | null
  chamber: QuoteChamber | null
  jurisdiction: QuoteJurisdiction
  quote_date: string | null
  quote_text: string
  context_excerpt: string | null
  topics: string[]
  language: QuoteLanguage
  status: QuoteStatus
  submitted_at: string
  reviewed_at: string | null
  editor_notes: string | null
  dedup_hash: string
}

/** Pre-classification raw text blob + metadata from a source scraper. */
export interface RawSourceCandidate {
  source_type: QuoteSourceType
  source_url: string | null
  jurisdiction: QuoteJurisdiction
  rawText: string
  hintedSpeaker?: string
  hintedRole?: string
  hintedParty?: string
  hintedChamber?: QuoteChamber
  hintedDate?: string
}

/** Post-classification candidate ready for insertCandidate(). */
export interface QuoteCandidate {
  source_type: QuoteSourceType
  source_url: string | null
  speaker_name: string
  speaker_role: string | null
  party: string | null
  chamber: QuoteChamber | null
  jurisdiction: QuoteJurisdiction
  quote_date: string | null
  quote_text: string
  context_excerpt: string | null
  topics: string[]
  language: QuoteLanguage
}

export interface QuoteFilters {
  party?: string
  chamber?: QuoteChamber
  jurisdiction?: QuoteJurisdiction
  year?: number
  topic?: string
  q?: string
  limit?: number
  cursor?: string
}
