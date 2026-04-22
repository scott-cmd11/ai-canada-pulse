"use client"

import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
    setMounted(true)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute("data-theme", next ? "dark" : "")
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="theme-toggle rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm"
      suppressHydrationWarning
    >
      {mounted ? (dark ? "\u2600 Light" : "\u25CF Dark") : "\u25CF Dark"}
    </button>
  )
}
