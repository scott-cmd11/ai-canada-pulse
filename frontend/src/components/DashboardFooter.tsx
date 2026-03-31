"use client"

import Link from "next/link"

export default function DashboardFooter() {
  return (
    <footer
      className="mt-8 border-t"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--surface-primary)',
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Top row: branding + social icons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>AI Canada Pulse</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>
              A project by{' '}
              <a href="https://scotthazlitt.ai" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                Scott Hazlitt
              </a>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://scotthazlitt.ai"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Website"
              className="transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/scott-hazlitt/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://github.com/scott-cmd11"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom row: copyright + links */}
        <div className="mt-3 flex flex-col items-center gap-2 border-t pt-3 text-xs sm:flex-row sm:justify-between" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          <p>&copy; {new Date().getFullYear()} AI Canada Pulse. AI-generated content is clearly labelled and may contain errors.</p>
          <div className="flex items-center gap-3">
            <Link href="/legal" className="hover:underline" style={{ color: 'var(--text-muted)' }}>Privacy & Legal</Link>
            <span>·</span>
            <Link href="/methodology" className="hover:underline" style={{ color: 'var(--text-muted)' }}>Methodology</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
