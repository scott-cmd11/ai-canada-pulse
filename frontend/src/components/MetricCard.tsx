import type { Metric } from "@/lib/mock-data"

const sentimentStyles = {
  positive:   { dot: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  neutral:    { dot: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  concerning: { dot: "#dc2626", bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
}

interface Props {
  metric: Metric
}

export default function MetricCard({ metric }: Props) {
  const style = sentimentStyles[metric.sentiment]

  return (
    <div
      className="rounded-xl border-2 p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
      style={{ background: style.bg, borderColor: style.border }}
      title={metric.description}
    >
      <span className="text-3xl" aria-hidden="true">{metric.icon}</span>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {metric.label}
        </p>
        <p className="text-base font-bold leading-tight" style={{ color: style.text }}>
          {metric.status}
        </p>
      </div>

      {/* Coloured accent bar replaces sparkline */}
      <div
        className="h-1 rounded-full mt-auto"
        style={{ background: style.dot }}
      />
    </div>
  )
}
