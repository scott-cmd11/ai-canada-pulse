"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { Story, PulseData } from "@/lib/mock-data"
import { usePolling } from "./usePolling"

interface StoriesData {
  stories: Story[]
  pulse: PulseData | null
  executiveBrief: string[]
  loading: boolean
  lastUpdated: string | null
}

const StoriesContext = createContext<StoriesData>({
  stories: [],
  pulse: null,
  executiveBrief: [],
  loading: true,
  lastUpdated: null,
})

function transform(json: Record<string, unknown>): StoriesData | null {
  const stories = (json.stories as Story[] | undefined) ?? []
  const pulse = (json.pulse as PulseData | undefined) ?? null
  const executiveBrief = (json.executiveBrief as string[] | undefined) ?? []
  return { stories, pulse, executiveBrief, loading: false, lastUpdated: null }
}

export function StoriesProvider({ children }: { children: ReactNode }) {
  const { data, loading, lastUpdated } = usePolling<StoriesData>("/api/v1/stories", {
    intervalMs: 120_000,
    transform,
  })

  const value: StoriesData = {
    stories: data?.stories ?? [],
    pulse: data?.pulse ?? null,
    executiveBrief: data?.executiveBrief ?? [],
    loading,
    lastUpdated,
  }

  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>
}

export function useStories() {
  return useContext(StoriesContext)
}
