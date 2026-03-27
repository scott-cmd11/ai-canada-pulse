"use client"

import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [hovered, setHovered] = useState(false)

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm"
      style={{
        color: hovered ? "var(--accent-primary)" : "var(--text-muted)",
        borderColor: hovered ? "color-mix(in srgb, var(--accent-primary) 40%, transparent)" : "var(--border-strong)",
        background: "var(--surface-primary)",
      }}
    >
      {dark ? "\u2600 Light" : "\u25CF Dark"}
    </button>
  )
}
