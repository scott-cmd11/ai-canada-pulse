// Federal Hansard + committees via OpenParliament.ca.
// Reuses fetchParliamentAIMentions() from the existing parliament-client.ts;
// each mention becomes a RawSourceCandidate for classification.

import { fetchParliamentAIMentions } from "@/lib/parliament-client"
import type { RawSourceCandidate } from "../types"

export async function fetchFederalHansardCandidates(): Promise<RawSourceCandidate[]> {
  try {
    const { mentions } = await fetchParliamentAIMentions()
    return mentions.map((m) => ({
      source_type: "federal_hansard",
      source_url: m.url,
      jurisdiction: "federal",
      rawText: `${m.topic}\n\n${m.excerpt}`,
      hintedSpeaker: m.speaker || undefined,
      hintedParty: m.party || undefined,
      hintedChamber: "house",
      hintedDate: m.date || undefined,
    }))
  } catch (err) {
    console.warn("[quotes/source/federal-hansard] fetch failed:", err)
    return []
  }
}
