/**
 * Topic content loader — pairs the lightweight topic registry (lib/topics.ts)
 * with longer editorial content (explainers, people, further reading).
 *
 * v1 stores content as TypeScript modules under src/content/topics/*.ts.
 * Reasons: type-safe, no parser dep, zero runtime file reads. When rollout
 * scales past the flagship 5 we'll likely migrate to MDX for friendlier
 * editorial updates — the types here should survive that migration.
 */

export interface Person {
    name: string
    role: string
    org?: string
}

export interface LinkRef {
    label: string
    url: string
}

export interface TopicContent {
    slug: string
    // ISO date string (YYYY-MM-DD) of the last content review.
    updatedAt: string
    // 300–500 words of plain-language background, one paragraph per string.
    explainerParagraphs: string[]
    // 3 bullets answering "why this matters".
    whyItMatters: string[]
    // Optional — empty list renders nothing.
    keyPeople: Person[]
    keyOrgs: LinkRef[]
    furtherReading: LinkRef[]
}

// Static import map for the flagship topics. Using static imports instead of
// dynamic require() keeps everything tree-shakeable and typechecked end to end.
import aida from "@/content/topics/aida"
import computeCapacity from "@/content/topics/compute-capacity"
import milaVectorAmii from "@/content/topics/mila-vector-amii"
import aiJobsMarket from "@/content/topics/ai-jobs-market"
import regionalEcosystems from "@/content/topics/regional-ecosystems"

const CONTENT_BY_SLUG: Record<string, TopicContent> = {
    [aida.slug]: aida,
    [computeCapacity.slug]: computeCapacity,
    [milaVectorAmii.slug]: milaVectorAmii,
    [aiJobsMarket.slug]: aiJobsMarket,
    [regionalEcosystems.slug]: regionalEcosystems,
}

export function getTopicContent(slug: string): TopicContent | null {
    return CONTENT_BY_SLUG[slug] ?? null
}

export function hasTopicContent(slug: string): boolean {
    return slug in CONTENT_BY_SLUG
}

export function getAllContentSlugs(): string[] {
    return Object.keys(CONTENT_BY_SLUG)
}
