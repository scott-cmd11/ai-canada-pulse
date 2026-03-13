"use client"

const sections = [
  { id: "acceleration", label: "Signals" },
  { id: "capacity", label: "Capacity" },
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
    <nav className="flex flex-wrap items-center gap-2 border-b border-slate-200 py-3 px-1">
      <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Navigate
      </span>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => scrollTo(section.id)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          {section.label}
        </button>
      ))}
    </nav>
  )
}