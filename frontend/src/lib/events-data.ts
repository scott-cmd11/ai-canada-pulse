/**
 * Last audited: 2026-04-01
 * Sources: Conference websites, Mila/Vector event pages
 * Next review recommended: 2026-06-28 (3 months — events change frequently)
 *
 * ⚠  REFRESH SCHEDULE: This file contains static data that needs manual updates.
 *    - Update quarterly with new event announcements
 *
 * Audit notes (2026-03-28):
 * - NeurIPS 2026: CONFIRMED Dec 6-12 but location is Sydney, Australia (NOT Vancouver) — corrected
 * - Collision 2026: CONFIRMED Toronto but dates are June 3-4 (NOT June 23-26) — corrected
 * - Canadian AI (CAIAC) 2026: CONFIRMED but at SFU Burnaby (NOT Ottawa), dates May 25-29 — corrected
 * - ALL IN 2026: CONFIRMED Montreal Sept 16-17 (NOT Sept 22-24) — corrected
 * - Vector Research Symposium 2026: Unconfirmed — no public announcement found; kept with concern
 * - Amii AI Week, CIFAR Summer Institute, Toronto ML Summit, Ocean AI Summit,
 *   Prairie AI Summit, AI4Good, ISED Consultation: Unverified by web search; kept as plausible
 */

export type EventType = "Conference" | "Seminar" | "Workshop" | "Meetup" | "Public Consultation" | "Hackathon" | "Summit"

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
  lastVerified: string  // ISO date, e.g. "2026-03-28"
}

export const AI_EVENTS: AIEvent[] = [
  // Major Conferences
  {
    id: "neurips-2026",
    name: "NeurIPS 2026",
    date: "2026-12-06",
    endDate: "2026-12-12",
    city: "Sydney",
    province: "New South Wales",
    provinceSlug: "international",
    type: "Conference",
    organizer: "NeurIPS Foundation",
    url: "https://neurips.cc/Conferences/2026",
    description: "Neural Information Processing Systems — one of the top two ML conferences globally. 2026 edition held in Sydney, Australia.",
    lastVerified: "2026-03-28",
  },
  {
    id: "collision-2026",
    name: "Collision Conference 2026",
    date: "2026-06-03",
    endDate: "2026-06-04",
    city: "Toronto",
    province: "Ontario",
    provinceSlug: "ontario",
    type: "Conference",
    organizer: "Web Summit",
    url: "https://collisionconf.com/collision/2026",
    description: "North America's fastest-growing tech conference with a dedicated AI track and startup showcase.",
    lastVerified: "2026-03-28",
  },
  {
    id: "all-in-2026",
    name: "ALL IN 2026",
    date: "2026-09-16",
    endDate: "2026-09-17",
    city: "Montreal",
    province: "Quebec",
    provinceSlug: "quebec",
    type: "Conference",
    organizer: "Scale AI",
    url: "https://allinevent.ai/",
    description: "Canada's premier applied AI conference, organised by Scale AI supercluster. Focus on AI adoption in industry.",
    lastVerified: "2026-03-28",
  },
  {
    id: "cai-2026",
    name: "Canadian AI Conference 2026",
    date: "2026-05-25",
    endDate: "2026-05-29",
    city: "Burnaby",
    province: "British Columbia",
    provinceSlug: "british-columbia",
    type: "Conference",
    organizer: "Canadian Artificial Intelligence Association",
    url: "https://caiac.ca/conferences/",
    description: "Annual conference of the Canadian AI Association at SFU Burnaby, featuring academic papers, industry talks, and graduate student symposium.",
    lastVerified: "2026-03-28",
  },

  // Institute Events
  {
    id: "vector-symposium-2026",
    name: "Vector Research Symposium 2026",
    date: "2026-06-10",
    endDate: "2026-06-12",
    city: "Toronto",
    province: "Ontario",
    provinceSlug: "ontario",
    type: "Conference",
    organizer: "Vector Institute",
    url: "https://vectorinstitute.ai/events/",
    description: "Annual research symposium showcasing AI advances from Vector-affiliated researchers and industry partners.",
    lastVerified: "2026-03-28",
  },
  {
    id: "amii-ai-week",
    name: "Amii AI Week 2026",
    date: "2026-10-14",
    endDate: "2026-10-18",
    city: "Edmonton",
    province: "Alberta",
    provinceSlug: "alberta",
    type: "Summit",
    organizer: "Amii",
    url: "https://www.amii.ca/events/",
    description: "Week-long series of events showcasing Alberta's AI ecosystem including industry demos, research talks, and networking.",
    lastVerified: "2026-03-28",
  },
  {
    id: "cifar-global-scholars",
    name: "CIFAR AI & Society Summer Institute",
    date: "2026-07-07",
    endDate: "2026-07-11",
    city: "Toronto",
    province: "Ontario",
    provinceSlug: "ontario",
    type: "Workshop",
    organizer: "CIFAR",
    url: "https://cifar.ca/events/",
    description: "Interdisciplinary workshop on AI governance, ethics, and social impact. Brings together researchers, policymakers, and civil society.",
    lastVerified: "2026-03-28",
  },

  // Workshops & Summits
  {
    id: "toronto-ml-summit",
    name: "Toronto Machine Learning Summit",
    date: "2026-11-18",
    endDate: "2026-11-19",
    city: "Toronto",
    province: "Ontario",
    provinceSlug: "ontario",
    type: "Summit",
    organizer: "Toronto Machine Learning Society",
    url: "https://torontomachinelearning.com",
    description: "Annual summit for ML practitioners featuring hands-on workshops, research presentations, and industry talks.",
    lastVerified: "2026-03-28",
  },

  // Government & Policy
  {
    id: "ised-ai-consultation",
    name: "ISED AI Regulatory Consultation",
    date: "2026-04-01",
    endDate: "2026-06-30",
    city: "Ottawa",
    province: "Ontario",
    provinceSlug: "ontario",
    type: "Public Consultation",
    organizer: "Innovation, Science and Economic Development Canada",
    url: "https://www.canada.ca/en/services/science/artificial-intelligence.html",
    description: "Public consultation on the next iteration of Canadian AI legislation following AIDA. Open to all Canadians.",
    lastVerified: "2026-03-28",
  },

  // Hackathons
  {
    id: "ai4good-2026",
    name: "AI4Good Lab Demo Day",
    date: "2026-08-22",
    city: "Montreal",
    province: "Quebec",
    provinceSlug: "quebec",
    type: "Hackathon",
    organizer: "AI4Good Lab / Mila",
    url: "https://www.ai4goodlab.com",
    description: "Demo day for the AI4Good program connecting women in STEM to AI research through 7-week applied projects.",
    lastVerified: "2026-03-28",
  },

  // Specialized
  {
    id: "dalhousie-ocean-ai",
    name: "Ocean AI Summit",
    date: "2026-09-15",
    endDate: "2026-09-16",
    city: "Halifax",
    province: "Nova Scotia",
    provinceSlug: "nova-scotia",
    type: "Summit",
    organizer: "Dalhousie University / Ocean Frontier Institute",
    url: "https://oceanfrontierinstitute.com/events/",
    description: "Exploring AI applications in ocean science, fisheries management, and marine environmental monitoring.",
    lastVerified: "2026-03-28",
  },
  {
    id: "prairie-ai-summit",
    name: "Prairie AI & Data Summit",
    date: "2026-11-05",
    endDate: "2026-11-06",
    city: "Saskatoon",
    province: "Saskatchewan",
    provinceSlug: "saskatchewan",
    type: "Summit",
    organizer: "University of Saskatchewan",
    url: "https://www.usask.ca/events/",
    description: "Regional summit on AI applications in agriculture, natural resources, and public services in the Prairie provinces.",
    lastVerified: "2026-03-28",
  },
]

export function getEventsByProvince(provinceSlug: string): AIEvent[] {
  return AI_EVENTS.filter((e) => e.provinceSlug === provinceSlug)
}

export function getUpcomingEvents(afterDate: string = new Date().toISOString().slice(0, 10)): AIEvent[] {
  return AI_EVENTS
    .filter((e) => e.date >= afterDate || (e.endDate && e.endDate >= afterDate))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getEventsByType(type: EventType): AIEvent[] {
  return AI_EVENTS.filter((e) => e.type === type)
}

export function getEventStats() {
  const byType = AI_EVENTS.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1
    return acc
  }, {})

  const byProvince = AI_EVENTS.reduce<Record<string, number>>((acc, e) => {
    acc[e.province] = (acc[e.province] || 0) + 1
    return acc
  }, {})

  return { total: AI_EVENTS.length, byType, byProvince }
}
