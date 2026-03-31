"use client"

import { useId, useState } from "react"
import Link from "next/link"

export default function DashboardFooter() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showTechStack, setShowTechStack] = useState(false)
  const disclaimerId = useId()
  const techStackId = useId()

  return (
    <footer
      className="mt-8 border-t backdrop-blur-xl"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--surface-primary)',
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 md:items-start">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>AI Canada Pulse</p>
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Canada-focused monitoring for an accelerating AI era</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              A project by <a href="https://scotthazlitt.ai" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>Scott Hazlitt</a>
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <a href="mailto:scott.hazlitt@gmail.com" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>scott.hazlitt@gmail.com</a>
              <span className="mx-2" style={{ color: 'var(--text-muted)' }}>|</span>
              <a href="https://www.linkedin.com/in/scott-hazlitt/" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>LinkedIn</a>
              <span className="mx-2" style={{ color: 'var(--text-muted)' }}>|</span>
              <Link href="/legal" className="hover:underline" style={{ color: 'var(--accent-primary)' }}>Privacy & Legal</Link>
            </p>
          </div>

          <div className="space-y-2 md:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>Transparency</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              5+ public sources powering Canada signals, benchmarks, market context, and research monitoring.
            </p>
            <Link href="/methodology" className="inline-flex text-sm font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
              View sources and methodology
            </Link>
          </div>
        </div>

        <div className="mt-5 space-y-2 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <button
              type="button"
              aria-expanded={showDisclaimer}
              aria-controls={disclaimerId}
              onClick={() => setShowDisclaimer((open) => !open)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--surface-primary)',
                color: 'var(--text-muted)',
              }}
            >
              <span>{showDisclaimer ? "Hide" : "Show"}</span>
              <span>AI and data disclaimer</span>
            </button>
            {showDisclaimer && (
              <div id={disclaimerId} className="mt-3 max-w-4xl text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <p>
                  <strong style={{ color: 'var(--text-secondary)' }}>AI Disclaimer:</strong> This platform uses artificial intelligence models to generate article summaries, executive briefs, and sentiment analysis. AI-generated content is marked with a * symbol and should not be treated as authoritative analysis. Market data is delayed and should not be used for trading decisions. Always verify critical information with primary sources.
                </p>
                <p className="mt-2 italic">
                  This is a personal project created on personal time and resources. It does not represent the views of, and is not affiliated with, the Government of Canada or any government department.
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              aria-expanded={showTechStack}
              aria-controls={techStackId}
              onClick={() => setShowTechStack((open) => !open)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--surface-primary)',
                color: 'var(--text-muted)',
              }}
            >
              <span>{showTechStack ? "Hide" : "Show"}</span>
              <span>Tech stack</span>
            </button>
            {showTechStack && (
              <div id={techStackId} className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Built with</span>
                <a href="https://docs.anthropic.com/en/docs/claude-code" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Claude Code</a>
                <span>|</span>
                <a href="https://github.com/google-gemini/gemini-cli" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Gemini CLI</a>
                <span>|</span>
                <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Next.js</a>
                <span>|</span>
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Vercel</a>
                <span>|</span>
                <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Tailwind CSS</a>
                <span>|</span>
                <a href="https://echarts.apache.org" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>ECharts</a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 border-t pt-4 text-center text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          <p>&copy; {new Date().getFullYear()} AI Canada Pulse. AI-generated content is clearly labelled and may contain errors.</p>
        </div>
      </div>
    </footer>
  )
}
