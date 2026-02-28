"use client"

export default function Header() {
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-200 tracking-tight">
            AI Canada Pulse
          </span>
          <span className="text-slate-700 hidden sm:block">·</span>
          <p className="text-xs text-slate-500 hidden sm:block">{today}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Live
        </span>
      </div>
    </header>
  )
}
