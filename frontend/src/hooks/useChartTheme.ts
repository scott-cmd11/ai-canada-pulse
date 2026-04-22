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
  text: "#0a0a0a",
  textSecondary: "#2e2e2e",
  textMuted: "#6b6b6b",
  axisLine: "#0a0a0a",
  splitLine: "#d9d0b8",
  tooltipBg: "#ffffff",
  tooltipBorder: "#0a0a0a",
  tooltipText: "#2e2e2e",
  tooltipValue: "#0a0a0a",
  accent: "#D52B1E",
  accentDim: "rgba(213, 43, 30, 0.12)",
  positive: "#0d7c8f",
  negative: "#D52B1E",
  neutral: "#9a917c",
}

const DARK: ChartTheme = {
  text: "#f7f1e1",
  textSecondary: "#d9d0b8",
  textMuted: "#9a917c",
  axisLine: "#f7f1e1",
  splitLine: "#2e2e2e",
  tooltipBg: "#141414",
  tooltipBorder: "#f7f1e1",
  tooltipText: "#d9d0b8",
  tooltipValue: "#f7f1e1",
  accent: "#ef4a3d",
  accentDim: "rgba(239, 74, 61, 0.15)",
  positive: "#2bb4c9",
  negative: "#ef4a3d",
  neutral: "#6b6b6b",
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
