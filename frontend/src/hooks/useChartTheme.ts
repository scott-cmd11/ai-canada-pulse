"use client"

import { useState, useEffect } from "react"

export interface ChartTheme {
  text: string
  textSecondary: string
  textMuted: string
  axisLine: string
  splitLine: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  tooltipValue: string
  accent: string
  accentDim: string
  positive: string
  negative: string
  neutral: string
}

const LIGHT: ChartTheme = {
  text: "#0F172A",
  textSecondary: "#334155",
  textMuted: "#64748B",
  axisLine: "#CBD5E1",
  splitLine: "#F1F5F9",
  tooltipBg: "#FFFFFF",
  tooltipBorder: "#E2E8F0",
  tooltipText: "#334155",
  tooltipValue: "#0F172A",
  accent: "#4338CA",
  accentDim: "rgba(67, 56, 202, 0.15)",
  positive: "#16A34A",
  negative: "#DC2626",
  neutral: "#94A3B8",
}

const DARK: ChartTheme = {
  text: "#E2E8F0",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  axisLine: "#334155",
  splitLine: "#1E293B",
  tooltipBg: "#1E293B",
  tooltipBorder: "#334155",
  tooltipText: "#CBD5E1",
  tooltipValue: "#E2E8F0",
  accent: "#818CF8",
  accentDim: "rgba(129, 140, 248, 0.15)",
  positive: "#34D399",
  negative: "#F87171",
  neutral: "#64748B",
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(LIGHT)

  useEffect(() => {
    function update() {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark"
      setTheme(isDark ? DARK : LIGHT)
    }
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => obs.disconnect()
  }, [])

  return theme
}
