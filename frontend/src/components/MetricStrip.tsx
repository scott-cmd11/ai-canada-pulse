import MetricCard from "./MetricCard"
import { metrics } from "@/lib/mock-data"

export default function MetricStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <MetricCard key={m.id} metric={m} />
      ))}
    </div>
  )
}
