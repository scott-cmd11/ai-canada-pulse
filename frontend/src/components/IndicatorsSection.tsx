"use client"

import { useState, useEffect } from "react"
import { indicators as defaultIndicators } from "@/lib/indicators-data"
import type { Indicator } from "@/lib/indicators-data"
import IndicatorChart from "./IndicatorChart"

export default function IndicatorsSection() {
  const [data, setData] = useState<Indicator[]>(defaultIndicators)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/indicators", { cache: "no-cache" })
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json) && json.length > 0) {
          setData(json)
        }
      })
      .catch((err) => console.warn("[IndicatorsSection] fetch failed:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <div className="section-header">
        <h2>Economic Context</h2>
      </div>
      <p className="text-sm text-slate-600 mb-6 max-w-3xl leading-relaxed">
        Canada&apos;s macroeconomic conditions directly shape AI adoption, investment, and talent flows. Rising unemployment may signal AI-driven displacement; youth joblessness is an early indicator of entry-level automation. GDP growth fuels venture capital and R&amp;D budgets, while inflation affects the cost of compute infrastructure. All data is sourced live from Statistics Canada, updated monthly.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((ind) => (
          <IndicatorChart
            key={ind.id}
            title={ind.title}
            data={ind.data}
            unit={ind.unit}
            color={"var(--accent-primary)"}
            description={ind.description}
            sourceLabel={ind.sourceLabel}
          />
        ))}
      </div>
      {loading && (
        <p className="text-sm font-medium text-slate-500 mt-4">
          Retrieving baseline economic data...
        </p>
      )}
    </section>
  )
}
