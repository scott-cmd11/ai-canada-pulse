"use client"

import { useId, useState } from "react"
import Link from "next/link"

export default function DashboardFooter() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showTechStack, setShowTechStack] = useState(false)
  const disclaimerId = useId()
  const techStackId = useId()

  return (
    <footer className="mt-8 border-t border-white/50 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 md:items-start">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">AI Canada Pulse</p>
            <p className="text-base font-semibold text-slate-900">Canada-focused monitoring for an accelerating AI era</p>
            <p className="text-sm leading-relaxed text-slate-600">
              v3.0 | Dynamic AI Data Architecture | <span className="font-semibold text-amber-700">Work in Progress</span>
            </p>
            <p className="text-sm text-slate-600">
              Contact: <a href="mailto:scott.hazlitt@gmail.com" className="font-semibold text-indigo-700 hover:underline">scott.hazlitt@gmail.com</a>
              <span className="mx-2 text-slate-300">|</span>
              <a href="https://www.linkedin.com/in/scott-hazlitt/" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 hover:underline">LinkedIn</a>
            </p>
          </div>

          <div className="space-y-2 md:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Transparency</p>
            <p className="text-sm leading-relaxed text-slate-600">
              5+ public sources powering Canada signals, benchmarks, market context, and research monitoring.
            </p>
            <Link href="/methodology" className="inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
              View sources and methodology
            </Link>
          </div>
        </div>

        <div className="mt-5 space-y-2 border-t border-slate-200/70 pt-4">
          <div>
            <button
              type="button"
              aria-expanded={showDisclaimer}
              aria-controls={disclaimerId}
              onClick={() => setShowDisclaimer((open) => !open)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
            >
              <span>{showDisclaimer ? "Hide" : "Show"}</span>
              <span>AI and data disclaimer</span>
            </button>
            {showDisclaimer && (
              <div id={disclaimerId} className="mt-3 max-w-4xl text-xs leading-relaxed text-slate-500">
                <p>
                  <strong className="text-slate-600">AI Disclaimer:</strong> This platform uses artificial intelligence models to generate article summaries, executive briefs, and sentiment analysis. AI-generated content is marked with a * symbol and should not be treated as authoritative analysis. Market data is delayed and should not be used for trading decisions. Always verify critical information with primary sources.
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
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
            >
              <span>{showTechStack ? "Hide" : "Show"}</span>
              <span>Tech stack</span>
            </button>
            {showTechStack && (
              <div id={techStackId} className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">Built with</span>
                <a href="https://docs.anthropic.com/en/docs/claude-code" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Claude Code</a>
                <span>|</span>
                <a href="https://github.com/google-gemini/gemini-cli" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Gemini CLI</a>
                <span>|</span>
                <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Next.js</a>
                <span>|</span>
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Vercel</a>
                <span>|</span>
                <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Tailwind CSS</a>
                <span>|</span>
                <a href="https://echarts.apache.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">ECharts</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}