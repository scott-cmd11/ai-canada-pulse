"use client"

import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark")
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
      className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-semibold shadow-sm hover:border-indigo-200 hover:text-indigo-700"
      style={{
        color: "var(--text-muted)",
        borderColor: "var(--border-strong)",
        background: "var(--surface-primary)",
      }}
    >
      {dark ? "\u2600 Light" : "\u25CF Dark"}
    </button>
  )
}
