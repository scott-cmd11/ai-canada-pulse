"use client"

import { useEffect, useState } from "react"

const sections = [
  { id: "acceleration", label: "Signals" },
  { id: "impact", label: "Impact" },
  { id: "more", label: "More" },
]

export default function SectionNav() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 240)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 },
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 168
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  return (
    <nav className="section-nav" data-compact={compact ? "true" : "false"} aria-label="Dashboard sections">
      <span>Navigate</span>
      <div>
        {sections.map((section) => {
          const isActive = activeId === section.id
          return (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              aria-pressed={isActive}
              data-active={isActive ? "true" : "false"}
            >
              {section.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
