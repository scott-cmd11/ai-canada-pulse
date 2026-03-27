"use client"

import { useState, useEffect } from "react"

const sections = [
  { id: "acceleration", label: "Signals" },
  { id: "capacity", label: "Capacity" },
  { id: "research", label: "Research" },
  { id: "talent", label: "Talent" },
  { id: "ecosystem", label: "Ecosystem" },
  { id: "impact", label: "Impact" },
  { id: "regulatory", label: "Regulatory" },
]

export default function SectionNav() {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the first intersecting section (topmost visible)
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          // Sort by boundingClientRect.top to get the topmost
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  return (
    <nav className="sticky top-[73px] z-40 rounded-2xl border px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl" style={{ borderColor: 'color-mix(in srgb, var(--surface-primary) 60%, transparent)', backgroundColor: 'color-mix(in srgb, var(--surface-primary) 85%, transparent)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
          Navigate
        </span>
        {sections.map((section) => {
          const isActive = activeId === section.id
          return (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className="rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-1"
              style={{
                borderColor: isActive
                  ? 'var(--accent-primary)'
                  : 'var(--border-subtle)',
                backgroundColor: isActive
                  ? 'color-mix(in srgb, var(--accent-primary) 12%, var(--surface-primary))'
                  : 'var(--surface-primary)',
                color: isActive
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 600,
                transform: isActive ? 'scale(1.04)' : 'scale(1)',
                boxShadow: isActive
                  ? '0 2px 8px color-mix(in srgb, var(--accent-primary) 20%, transparent)'
                  : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-primary) 8%, transparent)'
                  e.currentTarget.style.color = 'var(--accent-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  e.currentTarget.style.backgroundColor = 'var(--surface-primary)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              {section.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
