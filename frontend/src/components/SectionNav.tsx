"use client"

const sections = [
  { id: "acceleration", label: "Signals" },
  { id: "capacity", label: "Capacity" },
  { id: "research", label: "Research" },
  { id: "impact", label: "Impact" },
]

export default function SectionNav() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  return (
    <nav className="rounded-2xl border px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl" style={{ borderColor: 'color-mix(in srgb, var(--surface-primary) 60%, transparent)', backgroundColor: 'color-mix(in srgb, var(--surface-primary) 65%, transparent)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
          Navigate
        </span>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollTo(section.id)}
            className="rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm hover:-translate-y-0.5 transition-colors"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-primary)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-primary) 8%, transparent)'
              e.currentTarget.style.color = 'var(--accent-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.backgroundColor = 'var(--surface-primary)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  )
}