"use client"

import { useEffect, useState, useCallback } from "react"

const SHORTCUTS = [
  { key: "1", target: "acceleration", label: "Signals" },
  { key: "2", target: "capacity", label: "Capacity" },
  { key: "3", target: "research", label: "Research" },
  { key: "4", target: "impact", label: "Impact" },
  { key: "t", target: null, label: "Toggle theme" },
]

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo({ top: y, behavior: "smooth" })
  }
}

/**
 * Global keyboard shortcuts for the dashboard.
 * - 1-4: Jump to dashboard sections
 * - t: Toggle light/dark theme
 * - ?: Show/hide shortcut help
 */
export default function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false)

  const handleKey = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
    if (e.ctrlKey || e.metaKey || e.altKey) return

    if (e.key === "?") {
      setShowHelp((prev) => !prev)
      return
    }

    if (e.key === "Escape") {
      setShowHelp(false)
      return
    }

    const shortcut = SHORTCUTS.find((s) => s.key === e.key)
    if (!shortcut) return

    if (shortcut.target) {
      scrollToSection(shortcut.target)
    } else if (shortcut.key === "t") {
      const html = document.documentElement
      const current = html.getAttribute("data-theme")
      const next = current === "dark" ? "light" : "dark"
      html.setAttribute("data-theme", next)
      localStorage.setItem("theme", next)
    }
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  if (!showHelp) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center"
      onClick={() => setShowHelp(false)}
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-subtle)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Keyboard shortcuts
        </h3>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          Press <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-mono" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>?</kbd> to toggle this panel
        </p>

        <div className="mt-4 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              <kbd
                className="rounded border px-2 py-1 text-xs font-mono font-semibold"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'color-mix(in srgb, var(--surface-primary) 50%, var(--bg-page))',
                  color: 'var(--text-primary)',
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowHelp(false)}
          className="mt-5 w-full rounded-lg py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
