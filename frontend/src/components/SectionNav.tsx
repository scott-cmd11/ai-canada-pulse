"use client"

import { useState, useEffect } from "react"

const sections = [
  { id: "acceleration", label: "Signals" },
  { id: "adoption", label: "Adoption" },
  { id: "impact", label: "Impact" },
  { id: "more", label: "Deepen" },
]

export default function SectionNav() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [compact, setCompact] = useState(false)

  // Compress vertical padding once the user has scrolled past the hero so the
  // sticky nav takes less real estate during deep scrolls.
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 240)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      const y = el.getBoundingClientRect().top + window.scrollY - 168
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  return (
    <nav className={`sticky top-[72px] sm:top-[96px] z-40 rounded-[10px] border px-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-[padding] duration-200 ${compact ? 'py-1.5' : 'py-3'}`} style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'color-mix(in srgb, var(--surface-elevated) 91%, transparent)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 hidden text-[11px] font-semibold uppercase tracking-[0.08em] sm:inline" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono), monospace' }}>
          Briefing path
        </span>
        {sections.map((section) => {
          const isActive = activeId === section.id
          return (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className="min-h-[36px] rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-1"
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
                transform: 'none',
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
