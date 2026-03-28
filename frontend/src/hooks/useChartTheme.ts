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
  text: "#1c1917",
  textSecondary: "#44403c",
  textMuted: "#78716c",
  axisLine: "#d6d3d1",
  splitLine: "#f5f5f4",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e7e5e4",
  tooltipText: "#44403c",
  tooltipValue: "#1c1917",
  accent: "#c2410c",
  accentDim: "rgba(194, 65, 12, 0.12)",
  positive: "#166534",
  negative: "#dc2626",
  neutral: "#a8a29e",
}

const DARK: ChartTheme = {
  text: "#fafaf9",
  textSecondary: "#d6d3d1",
  textMuted: "#a8a29e",
  axisLine: "#44403c",
  splitLine: "#292524",
  tooltipBg: "#292524",
  tooltipBorder: "#44403c",
  tooltipText: "#d6d3d1",
  tooltipValue: "#fafaf9",
  accent: "#ea580c",
  accentDim: "rgba(234, 88, 12, 0.15)",
  positive: "#22c55e",
  negative: "#f87171",
  neutral: "#78716c",
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
