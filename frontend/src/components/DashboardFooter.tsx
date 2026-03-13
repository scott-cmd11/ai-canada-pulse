"use client"

import { useId, useState } from "react"
import Link from "next/link"

export default function DashboardFooter() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showTechStack, setShowTechStack] = useState(false)
  const disclaimerId = useId()
  const techStackId = useId()

  return (
    <footer className="mt-6 border-t border-slate-200 bg-white">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start text-sm">
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-800">AI Canada Pulse Platform</p>
            <p className="text-slate-600">
              <span className="font-medium">v3.0</span>
              <span className="mx-2 text-slate-300">|</span>
              <span>Dynamic AI Data Architecture</span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="font-semibold text-amber-600">Work in Progress</span>
            </p>
            <p className="text-slate-600">
              Contact:{" "}
              <a href="mailto:scott.hazlitt@gmail.com" className="text-indigo-700 hover:underline">
                scott.hazlitt@gmail.com
              </a>
              <span className="mx-2 text-slate-300">|</span>
              <a
                href="https://www.linkedin.com/in/scott-hazlitt/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-700 hover:underline"
              >
                LinkedIn
              </a>
            </p>
          </div>

          <div className="space-y-1.5 md:text-right">
            <p className="text-slate-600">
              <span className="font-medium text-slate-700">Sources:</span>{" "}
              5+ public sources (Stats Canada, Google Trends, Yahoo Finance, OpenAlex, METR)
            </p>
            <p>
              <Link href="/methodology" className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
                View all sources
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
          <div>
            <button
              type="button"
              aria-expanded={showDisclaimer}
              aria-controls={disclaimerId}
              onClick={() => setShowDisclaimer((open) => !open)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded"
            >
              <span>{showDisclaimer ? "Hide" : "Show"}</span>
              <span>AI & Data Disclaimer</span>
            </button>
            {showDisclaimer && (
              <div id={disclaimerId} className="mt-2 text-xs text-slate-500 leading-relaxed">
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
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded"
            >
              <span>{showTechStack ? "Hide" : "Show"}</span>
              <span>Tech Stack / Built With</span>
            </button>
            {showTechStack && (
              <div id={techStackId} className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Built with</span>
                <a href="https://docs.anthropic.com/en/docs/claude-code" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Claude Code</a>
                <span className="text-slate-300">|</span>
                <a href="https://github.com/google-gemini/gemini-cli" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Gemini CLI</a>
                <span className="text-slate-300">|</span>
                <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Next.js</a>
                <span className="text-slate-300">|</span>
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Vercel</a>
                <span className="text-slate-300">|</span>
                <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">Tailwind CSS</a>
                <span className="text-slate-300">|</span>
                <a href="https://echarts.apache.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-700 hover:underline">ECharts</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}