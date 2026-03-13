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
    <nav className="rounded-2xl border border-white/60 bg-white/65 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Navigate
        </span>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollTo(section.id)}
            className="rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-700"
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  )
}