"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import LiveTicker from "./LiveTicker"
import ThemeToggle from "./ThemeToggle"

const navLinks = [
  { label: "Digest", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Deep Dives", href: "/blog" },
  { label: "Provinces & Territories", href: "/provinces" },
  { label: "Methodology", href: "/methodology", mobileHidden: true },
]

export default function Header() {
  const pathname = usePathname()
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <header className="sticky top-0 z-50 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl" style={{ borderBottom: "1px solid var(--header-border)", background: "var(--header-bg)" }}>
      <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <LiveTicker />
      </div>

      <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="group relative z-10 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-orange-700 to-amber-600 text-sm font-black text-white shadow-[0_8px_30px_rgba(194,65,12,0.3)]">
                AI
              </div>
              <div>
                <span className="block text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Canada Pulse
                </span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                  Editorial intelligence monitor
                </span>
              </div>
            </Link>

            <div className="hidden h-8 w-px lg:block" style={{ backgroundColor: "color-mix(in srgb, var(--text-muted) 20%, transparent)" }}></div>

            <div className="hidden lg:flex lg:flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>Today</span>
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{today}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {navLinks.map(({ label, href, mobileHidden }) => {
              const isActive =
                href === "/" ? pathname === "/" :
                href === "/blog" ? pathname.startsWith("/blog") :
                href === "/provinces" ? pathname.startsWith("/provinces") :
                pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full border px-3.5 py-2 text-xs shadow-sm min-h-[36px] flex items-center${mobileHidden ? " hidden sm:flex" : ""}`}
                  style={{
                    borderColor: "var(--border-strong)",
                    color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 700 : 600,
                    background: "var(--surface-primary)",
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
