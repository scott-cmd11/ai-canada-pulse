"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
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
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const prefetchDashboard = useCallback(() => {
    router.prefetch("/dashboard")
  }, [router])

  useEffect(() => {
    const win = window as Window & { requestIdleCallback?: (callback: () => void) => number; cancelIdleCallback?: (id: number) => void }
    if (pathname === "/dashboard") return

    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(prefetchDashboard)
      return () => win.cancelIdleCallback?.(id)
    }

    const id = window.setTimeout(prefetchDashboard, 1200)
    return () => window.clearTimeout(id)
  }, [pathname, prefetchDashboard])

  return (
    <header className="site-header">
      <div className="site-ticker">
        <LiveTicker />
      </div>

      <div className="site-masthead">
        <div className="site-masthead-inner">
          <Link
            href="/dashboard"
            prefetch
            onMouseEnter={prefetchDashboard}
            onFocus={prefetchDashboard}
            className="brand-lockup"
          >
            <span aria-hidden="true" />
            <span>
              AI Canada Pulse
              <small>Live Index</small>
            </span>
          </Link>

          <div className="site-nav-wrap">
            <nav className="site-nav" aria-label="Primary navigation">
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
                    prefetch={href === "/dashboard" ? true : undefined}
                    onMouseEnter={href === "/dashboard" ? prefetchDashboard : undefined}
                    onFocus={href === "/dashboard" ? prefetchDashboard : undefined}
                    className={`${isActive ? "is-active" : ""}${mobileHidden ? " mobile-hidden" : ""}`.trim()}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            <ThemeToggle />
            <button
              className="site-menu-button"
              onClick={() => setMenuOpen((value) => !value)}
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

        {menuOpen && (
          <div className="site-mobile-menu">
            {navLinks.map(({ label, href }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={href === "/dashboard" ? true : undefined}
                  onMouseEnter={href === "/dashboard" ? prefetchDashboard : undefined}
                  onFocus={href === "/dashboard" ? prefetchDashboard : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={isActive ? "is-active" : ""}
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
