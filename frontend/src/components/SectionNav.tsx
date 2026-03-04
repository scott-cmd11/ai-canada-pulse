"use client"

const sections = [
    { id: "intelligence", label: "📋 Intelligence" },
    { id: "markets", label: "📈 Markets & Economy" },
    { id: "research", label: "🔬 Research & Innovation" },
    { id: "landscape", label: "🌐 Trends & Infrastructure" },
]

export default function SectionNav() {
    const scrollTo = (id: string) => {
        const el = document.getElementById(id)
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 80
            window.scrollTo({ top: y, behavior: "smooth" })
        }
    }

    return (
        <nav className="flex flex-wrap items-center gap-2 py-3 px-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Jump to:</span>
            {sections.map((s) => (
                <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all shadow-sm"
                >
                    {s.label}
                </button>
            ))}
        </nav>
    )
}
