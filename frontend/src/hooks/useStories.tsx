"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Story, PulseData } from "@/lib/mock-data"
import { usePolling } from "./usePolling"

interface StoriesData {
  stories: Story[]
  pulse: PulseData | null
  executiveBrief: string[]
  summary: string | null
  loading: boolean
  lastUpdated: string | null
}

export interface StoriesInitialData {
  stories: Story[]
  pulse: PulseData | null
  executiveBrief: string[]
  summary: string | null
}

const StoriesContext = createContext<StoriesData>({
  stories: [],
  pulse: null,
  executiveBrief: [],
  summary: null,
  loading: true,
  lastUpdated: null,
})

function transform(json: Record<string, unknown>): StoriesData | null {
  const stories = (json.stories as Story[] | undefined) ?? []
  const pulse = (json.pulse as PulseData | undefined) ?? null
  const executiveBrief = (json.executiveBrief as string[] | undefined) ?? []
  const summary = (json.summary as string | undefined) ?? null
  return { stories, pulse, executiveBrief, summary, loading: false, lastUpdated: null }
}

interface ProviderProps {
  children: ReactNode
  /**
   * Server-fetched initial snapshot. When provided, the first paint includes
   * the feed instead of a skeleton — client polling still runs for freshness.
   */
  initialData?: StoriesInitialData | null
}

export function StoriesProvider({ children, initialData }: ProviderProps) {
  // Stabilise the initial seed so usePolling's internal useState only reads it
  // on mount (React state init is lazy, but the object identity still matters
  // for the dependency graph inside usePolling).
  const seed = useMemo<StoriesData | null>(() => {
    if (!initialData) return null
    return {
      stories: initialData.stories,
      pulse: initialData.pulse,
      executiveBrief: initialData.executiveBrief,
      summary: initialData.summary,
      loading: false,
      lastUpdated: null,
    }
  }, [initialData])

  const { data, loading, lastUpdated } = usePolling<StoriesData>("/api/v1/stories", {
    intervalMs: 120_000,
    transform,
    initialData: seed,
  })

  const value: StoriesData = {
    stories: data?.stories ?? [],
    pulse: data?.pulse ?? null,
    executiveBrief: data?.executiveBrief ?? [],
    summary: data?.summary ?? null,
    loading,
    lastUpdated,
  }

  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>
}

export function useStories() {
  return useContext(StoriesContext)
}
