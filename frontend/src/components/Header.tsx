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
      className="sticky top-0 z-50 backdrop-blur"
      style={{
        borderBottom: "2px solid var(--border-strong)",
        background: "var(--header-bg)",
      }}
    >
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <LiveTicker />
      </div>

      <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 no-underline"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              aria-hidden
              className="h-5 w-[3px] shrink-0"
              style={{ background: "var(--accent-primary)" }}
            />
            <span
              className="text-[13px] uppercase"
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontWeight: 700,
                letterSpacing: "0.14em",
              }}
            >
              AI Canada Pulse
              <span className="mx-2" style={{ color: "var(--text-muted)" }}>·</span>
              <span style={{ color: "var(--text-muted)" }}>Live Index</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-1">
            <nav className="hidden sm:flex items-center">
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
                    className={`px-3 py-1.5 text-[11px] uppercase no-underline${mobileHidden ? " hidden md:inline-block" : ""}`}
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      letterSpacing: "0.14em",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#fff" : "var(--text-secondary)",
                      background: isActive ? "var(--text-primary)" : "transparent",
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
                className="sm:hidden flex items-center justify-center border min-h-[32px] w-9"
                style={{
                  borderColor: "var(--border-strong)",
                  background: "transparent",
                  color: "var(--text-primary)",
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
            className="sm:hidden flex flex-wrap gap-0 pt-3 mt-1"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            {navLinks.map(({ label, href }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 text-[11px] uppercase no-underline"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    letterSpacing: "0.14em",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    background: isActive ? "var(--text-primary)" : "transparent",
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
