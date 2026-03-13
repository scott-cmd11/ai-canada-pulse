"use client"

import Link from "next/link"
import { useCallback } from "react"
import { usePolling } from "@/hooks/usePolling"
import type { GlobalStory } from "@/lib/global-client"

interface GlobalContextData {
  brief: string[]
  sources: { name: string; count: number }[]
}

export default function GlobalContextBand() {
  const transform = useCallback((json: Record<string, unknown>) => {
    const brief = json.executiveBrief as string[] | undefined
    const stories = json.stories as GlobalStory[] | undefined

    if (!brief || brief.length === 0) return null

    const sourceCounts = new Map<string, number>()
    if (stories) {
      for (const story of stories.slice(0, 12)) {
        const name = story.sourceName || "Unknown"
        sourceCounts.set(name, (sourceCounts.get(name) || 0) + 1)
      }
    }

    const sources = Array.from(sourceCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return {
      brief: brief.slice(0, 2),
      sources,
    }
  }, [])

  const { data } = usePolling<GlobalContextData>("/api/v1/global-news", {
    intervalMs: 300000,
    transform,
  })

  if (!data || data.brief.length === 0) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Global Pace Context
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Frontier AI is moving fast. Canada needs context, not noise.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              This band keeps the main dashboard Canada-first while showing the global capability and policy moves that shape Canadian urgency.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-slate-700 lg:max-w-sm">
            <p className="font-semibold text-slate-900">Why it matters for Canada</p>
            <p className="mt-1 leading-relaxed">
              Global model, compute, and regulation moves set the pace Canadian institutions, labs, and firms are reacting to.
            </p>
            <Link href="/insights" className="mt-2 inline-flex font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
              Open global context
            </Link>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {data.brief.map((item, index) => (
            <article key={index} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {index === 0 ? "Frontier signal" : "Canada implication"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item}</p>
            </article>
          ))}
        </div>

        {data.sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Tracking</span>
            {data.sources.map((source) => (
              <span key={source.name} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600">
                {source.name} ({source.count})
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}