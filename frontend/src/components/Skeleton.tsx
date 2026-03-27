"use client"

/**
 * Reusable skeleton loading primitives for data sections.
 * Uses CSS custom variables for theme-aware shimmer.
 */

interface SkeletonBarProps {
  width?: string
  height?: string
  className?: string
}

export function SkeletonBar({ width = '100%', height = '12px', className = '' }: SkeletonBarProps) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{
        width,
        height,
        background: 'var(--border-subtle)',
        opacity: 0.6,
      }}
    />
  )
}

export function SkeletonCircle({ size = '32px' }: { size?: string }) {
  return (
    <div
      className="animate-pulse rounded-full"
      style={{
        width: size,
        height: size,
        background: 'var(--border-subtle)',
        opacity: 0.6,
      }}
    />
  )
}

/** Card-shaped skeleton matching a typical list-item row */
export function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-4"
      style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-primary)' }}
    >
      <div className="flex items-start gap-3">
        <SkeletonCircle size="36px" />
        <div className="flex-1 space-y-2">
          <SkeletonBar width="70%" height="14px" />
          <SkeletonBar width="100%" height="10px" />
          <SkeletonBar width="45%" height="10px" />
        </div>
      </div>
    </div>
  )
}

/** Chart-shaped skeleton: header + tall rectangle */
export function SkeletonChart() {
  return (
    <div className="space-y-3">
      <SkeletonBar width="40%" height="16px" />
      <div
        className="animate-pulse rounded-lg"
        style={{
          width: '100%',
          height: '180px',
          background: 'var(--border-subtle)',
          opacity: 0.4,
        }}
      />
    </div>
  )
}

/** Table-shaped skeleton: header row + data rows */
export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <SkeletonBar width="30%" height="12px" />
        <SkeletonBar width="20%" height="12px" />
        <SkeletonBar width="25%" height="12px" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 pt-1">
          <SkeletonBar width="30%" height="10px" />
          <SkeletonBar width="20%" height="10px" />
          <SkeletonBar width="25%" height="10px" />
        </div>
      ))}
    </div>
  )
}

/** Story feed skeleton: multiple card rows */
export function SkeletonStoryFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/** Generic section skeleton with title + content area */
export function SectionSkeleton({ title, variant = 'chart' }: { title: string; variant?: 'chart' | 'table' | 'cards' }) {
  return (
    <section>
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      <div className="saas-card p-6">
        {variant === 'chart' && <SkeletonChart />}
        {variant === 'table' && <SkeletonTable />}
        {variant === 'cards' && <SkeletonStoryFeed count={2} />}
      </div>
    </section>
  )
}
