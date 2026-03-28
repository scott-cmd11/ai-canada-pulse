// Canadian AI events and conferences — curated dataset
// Sources:
// - Conference websites, Mila/Vector/Amii/CIFAR event pages
// - Government of Canada AI consultation announcements
//
// ⚠  REFRESH SCHEDULE: This file contains static data that needs manual updates.
//    - Update quarterly with new event announcements
//    - Last verified: March 2026

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
    city: "Vancouver",
    province: "British Columbia",
    provinceSlug: "british-columbia",
    type: "Conference",
    organizer: "NeurIPS Foundation",
    url: "https://neurips.cc",
    description: "Neural Information Processing Systems — one of the top two ML conferences globally. Returns to Vancouver Convention Centre.",
  },
  {
    id: "collision-2026",
    name: "Collision Conference 2026",
    date: "2026-06-23",
    endDate: "2026-06-26",
    city: "Toronto",
    province: "Ontario",
    provinceSlug: "ontario",
    type: "Conference",
    organizer: "Web Summit",
    url: "https://collisionconf.com",
    description: "North America's fastest-growing tech conference with a dedicated AI track and startup showcase.",
  },
  {
    id: "all-in-2026",
    name: "ALL IN 2026",
    date: "2026-09-22",
    endDate: "2026-09-24",
    city: "Montreal",
    province: "Quebec",
    provinceSlug: "quebec",
    type: "Conference",
    organizer: "Scale AI",
    url: "https://www.allinmontreal.ai",
    description: "Canada's premier applied AI conference, organized by Scale AI supercluster. Focus on AI adoption in industry.",
  },
  {
    id: "cai-2026",
    name: "Canadian AI Conference 2026",
    date: "2026-05-26",
    endDate: "2026-05-30",
    city: "Ottawa",
    province: "Ontario",
    provinceSlug: "ontario",
    type: "Conference",
    organizer: "Canadian Artificial Intelligence Association",
    url: "https://www.caiac.ca",
    description: "Annual conference of the Canadian AI Association, featuring academic papers, industry talks, and graduate student symposium.",
  },

  // Institute Events
  {
    id: "mila-tea-talks",
    name: "Mila Tea Talks (Weekly)",
    date: "2026-01-08",
    endDate: "2026-12-17",
    city: "Montreal",
    province: "Quebec",
    provinceSlug: "quebec",
    type: "Seminar",
    organizer: "Mila",
    url: "https://mila.quebec/en/mila-tea-talks",
    description: "Weekly research seminars at Mila featuring cutting-edge AI research from local and international speakers.",
    recurring: true,
  },
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
    url: "https://vectorinstitute.ai",
    description: "Annual research symposium showcasing AI advances from Vector-affiliated researchers and industry partners.",
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
    url: "https://amii.ca",
    description: "Week-long series of events showcasing Alberta's AI ecosystem including industry demos, research talks, and networking.",
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
    url: "https://cifar.ca",
    description: "Interdisciplinary workshop on AI governance, ethics, and social impact. Brings together researchers, policymakers, and civil society.",
  },

  // Workshops & Meetups
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
  },
  {
    id: "montreal-ai-meetup",
    name: "Montreal AI Meetup (Monthly)",
    date: "2026-01-15",
    endDate: "2026-12-16",
    city: "Montreal",
    province: "Quebec",
    provinceSlug: "quebec",
    type: "Meetup",
    organizer: "Montreal AI Community",
    url: "https://www.meetup.com/Montreal-Artificial-Intelligence-Meetup/",
    description: "Monthly community meetup for AI enthusiasts, researchers, and practitioners in Montreal.",
    recurring: true,
  },
  {
    id: "vancouver-ai-meetup",
    name: "Vancouver AI Meetup (Monthly)",
    date: "2026-01-21",
    endDate: "2026-12-15",
    city: "Vancouver",
    province: "British Columbia",
    provinceSlug: "british-columbia",
    type: "Meetup",
    organizer: "Vancouver AI Community",
    url: "https://www.meetup.com/Vancouver-Artificial-Intelligence-Meetup/",
    description: "Monthly meetup connecting Vancouver's AI community with talks, demos, and networking.",
    recurring: true,
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
    url: "https://ised-isde.canada.ca/site/ised/en",
    description: "Public consultation on the next iteration of Canadian AI legislation following AIDA. Open to all Canadians.",
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
    url: "https://ai4good.org",
    description: "Demo day for the AI4Good program connecting women in STEM to AI research through 7-week applied projects.",
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
    url: "https://www.dal.ca",
    description: "Exploring AI applications in ocean science, fisheries management, and marine environmental monitoring.",
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
    url: "https://cs.usask.ca",
    description: "Regional summit on AI applications in agriculture, natural resources, and public services in the Prairie provinces.",
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
