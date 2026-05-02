"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import LiveTicker from "./LiveTicker"
import ThemeToggle from "./ThemeToggle"

const navLinks = [
  { label: "Digest", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Topics", href: "/topics" },
  { label: "Deep Dives", href: "/blog" },
  { label: "Data Centres", href: "/datacentres", mobileHidden: true },
  { label: "About", href: "/about", mobileHidden: true },
  { label: "Methodology", href: "/methodology", mobileHidden: true },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        borderBottom: "1px solid var(--header-border)",
        background: "var(--header-bg)",
        boxShadow: "0 10px 30px rgba(22, 39, 55, 0.06)",
      }}
    >
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <LiveTicker />
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3 no-underline"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              aria-hidden
              className="h-8 w-1 shrink-0 rounded-full"
              style={{ background: "linear-gradient(180deg, var(--accent-secondary), var(--accent-primary))" }}
            />
            <span
              className="min-w-0 text-[13px]"
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              <span className="whitespace-nowrap">AI Canada Pulse</span>
              <span className="mx-2" style={{ color: "var(--text-muted)" }}>/</span>
              <span className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>Live Index</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <nav
              className="hidden items-center rounded-full border p-1 sm:flex"
              style={{
                borderColor: "var(--border-subtle)",
                background: "color-mix(in srgb, var(--surface-muted) 70%, transparent)",
              }}
            >
              {navLinks.map(({ label, href, mobileHidden }) => {
                const isActive =
                  href === "/" ? pathname === "/" :
                  href === "/blog" ? pathname.startsWith("/blog") :
                  href === "/datacentres" ? pathname.startsWith("/datacentres") :
                  href === "/topics" ? pathname.startsWith("/topics") :
                  pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-full px-3 py-1.5 text-[11px] no-underline${mobileHidden ? " hidden md:inline-block" : ""}`}
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      letterSpacing: "0.06em",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "var(--text-on-invert)" : "var(--text-secondary)",
                      background: isActive ? "var(--surface-invert)" : "transparent",
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="ml-2 flex items-center gap-2">
              <ThemeToggle />
              <button
                className="flex min-h-[36px] w-10 items-center justify-center rounded-full border sm:hidden"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--surface-elevated)",
                  color: "var(--text-primary)",
                  boxShadow: "var(--shadow-soft)",
                }}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 2l10 10M12 2L2 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 4h12M1 7h12M1 10h12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div
            className="mt-2 grid gap-1 rounded-[10px] border p-2 sm:hidden"
            style={{ borderColor: "var(--border-subtle)", background: "var(--surface-elevated)" }}
          >
            {navLinks.map(({ label, href }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-[11px] no-underline"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    letterSpacing: "0.06em",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--text-on-invert)" : "var(--text-secondary)",
                    background: isActive ? "var(--surface-invert)" : "transparent",
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}
