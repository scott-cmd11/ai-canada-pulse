"use client"

import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  sectionName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary for dashboard sections. Catches render errors and displays
 * a graceful fallback instead of crashing the entire page.
 */
export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.warn(`[SectionErrorBoundary] ${this.props.sectionName || "Section"} failed:`, error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--surface-primary)',
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--status-negative) 10%, var(--surface-primary))',
                color: 'var(--status-negative)',
              }}
            >
              !
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {this.props.sectionName || "This section"} temporarily unavailable
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Data will appear when the source recovers. Other sections are unaffected.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
