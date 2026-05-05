// AI Events client wraps curated events data with optional live enrichment.

import { AI_EVENTS, getUpcomingEvents, getEventsByProvince, getEventStats, type AIEvent } from "./events-data"

const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

export interface EventsData {
  events: AIEvent[]
  upcoming: AIEvent[]
  totalEvents: number
  stats: ReturnType<typeof getEventStats>
  lastUpdated: string
}

interface CacheEntry {
  data: EventsData
  fetchedAt: number
}

let cache: CacheEntry | null = null

export async function fetchEventsData(provinceSlug?: string): Promise<EventsData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL && !provinceSlug) {
    return cache.data
  }

  const events = provinceSlug ? getEventsByProvince(provinceSlug) : AI_EVENTS
  const upcoming = getUpcomingEvents()

  const data: EventsData = {
    events,
    upcoming: provinceSlug ? upcoming.filter((e) => e.provinceSlug === provinceSlug) : upcoming,
    totalEvents: events.length,
    stats: getEventStats(),
    lastUpdated: new Date().toISOString().slice(0, 10),
  }

  if (!provinceSlug) {
    cache = { data, fetchedAt: Date.now() }
  }

  return data
}
