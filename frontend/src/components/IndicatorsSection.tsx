"use client"

import { useState, useEffect } from "react"
import { indicators as fallbackIndicators } from "@/lib/indicators-data"
import type { Indicator } from "@/lib/indicators-data"
import IndicatorChart from "./IndicatorChart"
import AnimatedSection from "./AnimatedSection"

export default function IndicatorsSection() {
  const [data, setData] = useState<Indicator[]>(fallbackIndicators)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/indicators")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => {}) // keep fallback
      .finally(() => setLoading(false))
  }, [])

  return (
    <AnimatedSection delay={60}>
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Economic Indicators — AI Adoption Context
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((ind) => (
            <IndicatorChart
              key={ind.id}
              title={ind.title}
              data={ind.data}
              unit={ind.unit}
              color={ind.color}
              description={ind.description}
            />
          ))}
        </div>
        {loading && (
          <p className="text-xs text-gray-400 mt-2">Fetching latest data from Stats Canada...</p>
        )}
      </section>
    </AnimatedSection>
  )
}
