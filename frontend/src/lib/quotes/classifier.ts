// LLM classifier: given a raw text blob + source metadata, decide whether it
// contains a genuine statement by a named Canadian government figure about AI,
// and if so, extract the fields needed to persist it.
//
// Strictness bias: prefer false negatives. The review queue can only catch
// false positives — a noisy classifier wastes editor time.

import type {
  QuoteCandidate,
  QuoteChamber,
  QuoteLanguage,
  RawSourceCandidate,
} from "./types"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ""
const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const MODEL = process.env.OPENAI_QUOTE_MODEL ?? "gpt-4o-mini"
const TIMEOUT_MS = 20_000

// Fast pre-filter before we spend a model call. Same vocabulary as
// parliament-client.ts AI_RELEVANT — both English and French AI terminology,
// deliberately narrow to avoid CSIS/CSE false positives.
const AI_RELEVANT = /\b(artificial intelligence|machine learning|intelligence artificielle|apprentissage (automatique|profond)|deep learning|neural network|generative ai|IA générative|LLM|large language model|AIDA|foundation model|modèle de fondation|chatgpt|openai|anthropic|gemini|algorithmic|facial recognition|reconnaissance faciale)\b/i

interface ClassifierResult {
  relevant: boolean
  speaker_name?: string
  speaker_role?: string
  party?: string
  chamber?: QuoteChamber
  quote_date?: string
  quote_text?: string
  context_excerpt?: string
  topics?: string[]
  language?: QuoteLanguage
}

const SYSTEM_PROMPT = `You classify text excerpts from Canadian government sources.

Your job: decide whether the excerpt contains a direct, on-the-record statement BY a named Canadian government figure (elected official, minister, or senior civil servant) ABOUT artificial intelligence as a technology.

Reject (return {"relevant": false}) if:
- The subject of "intelligence" is CSIS, CSE, national security, signals intelligence, military intelligence, foreign intelligence, criminal intelligence — any non-AI sense of the word.
- The speaker is not identifiable as a Canadian government figure (journalists, analysts, company execs paraphrased in press releases).
- The text is a media paraphrase of a quote rather than a real quote.
- AI appears only in passing ("we should also consider AI") without substance.
- The excerpt is shorter than ~12 words.

Accept if the excerpt is a substantive statement about AI by a named Canadian MP, Senator, Minister, Premier, MLA, Deputy Minister, or equivalent.

When accepting, extract:
- speaker_name: "Justin Trudeau", "François-Philippe Champagne", "Doug Ford"
- speaker_role: "Prime Minister", "Minister of Innovation, Science and Industry", "Premier of Ontario", "MP for Etobicoke—Lakeshore", "Deputy Minister, ISED"
- party: one of "Liberal", "Conservative", "NDP", "Bloc Québécois", "Green", "CAQ", "PQ", "BC NDP", "BC United", "UCP" — or null for civil service.
- chamber: "house", "senate", "provincial_legislature", or "executive" (for ministers/premiers speaking in official capacity, or civil servants).
- quote_date: ISO YYYY-MM-DD if determinable from the excerpt, else null.
- quote_text: the exact quote, trimmed to ≤400 chars. Preserve the original language (fr or en). Remove any speaker attribution preamble ("Mr. Smith: ...").
- context_excerpt: up to 200 chars of surrounding context (what was being debated, the press release topic), or null.
- topics: 1-4 slugs from: regulation, safety, investment, adoption, research, workforce, copyright, privacy, procurement, compute, ethics, education, health, defence, generative.
- language: "en" or "fr".

Output ONLY compact JSON. No prose, no markdown fencing.`

function preFilter(text: string): boolean {
  if (text.length < 60) return false
  return AI_RELEVANT.test(text)
}

async function callOpenAI(userPrompt: string): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    console.warn("[quotes/classifier] OPENAI_API_KEY missing — skipping classification")
    return null
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 600,
        temperature: 0,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      console.warn(`[quotes/classifier] OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return null
    }
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    return typeof content === "string" ? content : null
  } catch (err) {
    console.warn("[quotes/classifier] request failed:", err)
    return null
  }
}

function parseJson(raw: string): ClassifierResult | null {
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    return parsed as ClassifierResult
  } catch {
    return null
  }
}

/**
 * Classify a single raw candidate. Returns a QuoteCandidate ready to insert,
 * or null if the text is irrelevant or classification failed.
 */
export async function classify(raw: RawSourceCandidate): Promise<QuoteCandidate | null> {
  // Cheap gate first — skip the LLM call entirely if AI terms aren't present.
  if (!preFilter(raw.rawText)) return null

  const hints = [
    raw.hintedSpeaker ? `hinted_speaker: ${raw.hintedSpeaker}` : null,
    raw.hintedRole ? `hinted_role: ${raw.hintedRole}` : null,
    raw.hintedParty ? `hinted_party: ${raw.hintedParty}` : null,
    raw.hintedChamber ? `hinted_chamber: ${raw.hintedChamber}` : null,
    raw.hintedDate ? `hinted_date: ${raw.hintedDate}` : null,
    `jurisdiction: ${raw.jurisdiction}`,
    `source_type: ${raw.source_type}`,
  ].filter(Boolean).join("\n")

  const userPrompt = `Metadata:\n${hints}\n\nExcerpt:\n"""\n${raw.rawText.slice(0, 2000)}\n"""\n\nClassify and extract as JSON.`

  const rawOut = await callOpenAI(userPrompt)
  if (!rawOut) return null

  const parsed = parseJson(rawOut)
  if (!parsed || !parsed.relevant) return null
  if (!parsed.speaker_name || !parsed.quote_text) return null
  if (parsed.quote_text.length < 30) return null

  return {
    source_type:     raw.source_type,
    source_url:      raw.source_url,
    speaker_name:    parsed.speaker_name.trim(),
    speaker_role:    parsed.speaker_role?.trim() ?? null,
    party:           parsed.party?.trim() || null,
    chamber:         parsed.chamber ?? null,
    jurisdiction:    raw.jurisdiction,
    quote_date:      parsed.quote_date ?? raw.hintedDate ?? null,
    quote_text:      parsed.quote_text.trim().slice(0, 400),
    context_excerpt: parsed.context_excerpt?.trim().slice(0, 200) ?? null,
    topics:          Array.isArray(parsed.topics) ? parsed.topics.slice(0, 4) : [],
    language:        parsed.language === "fr" ? "fr" : "en",
  }
}

/** Classify many candidates with a concurrency cap. */
export async function classifyBatch(
  candidates: RawSourceCandidate[],
  concurrency = 4
): Promise<QuoteCandidate[]> {
  const results: QuoteCandidate[] = []
  const queue = [...candidates]

  async function worker() {
    while (queue.length > 0) {
      const next = queue.shift()
      if (!next) return
      const out = await classify(next)
      if (out) results.push(out)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}
