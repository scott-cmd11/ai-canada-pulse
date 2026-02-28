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
      <h2 className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Economic Indicators
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.map((ind) => (
          <IndicatorChart
            key={ind.id}
            title={ind.title}
            data={ind.data}
            unit={ind.unit}
            color={ind.color}
            description={ind.description}
            sourceLabel={ind.sourceLabel}
          />
        ))}
      </div>
      {loading && (
        <p className="text-xs text-slate-500 mt-2">Fetching latest data from Stats Canada...</p>
      )}
    </section>
  )
}
