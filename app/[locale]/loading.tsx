import { Activity } from "lucide-react";

export default function Loading() {
  return (
    <div className="pulse-shell mx-auto max-w-[1460px] px-4 py-8">
      {/* Loading message */}
      <div className="mb-8 flex flex-col items-center justify-center gap-3 py-6">
        <Activity size={28} className="animate-spin text-primary" />
        <p className="text-body text-textSecondary">
          Fetching latest signals &mdash; please wait
        </p>
      </div>

      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-borderSoft" />
        <div className="flex gap-3">
          <div className="h-8 w-20 animate-pulse rounded bg-borderSoft" />
          <div className="h-8 w-20 animate-pulse rounded bg-borderSoft" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-borderSoft bg-surface p-4"
          >
            <div className="mb-2 h-3 w-20 animate-pulse rounded bg-borderSoft" />
            <div className="h-8 w-16 animate-pulse rounded bg-borderSoft" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,420px]">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-borderSoft bg-surface p-4"
            >
              <div className="mb-2 h-3 w-3/4 animate-pulse rounded bg-borderSoft" />
              <div className="mb-2 h-5 w-full animate-pulse rounded bg-borderSoft" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-borderSoft" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-borderSoft bg-surface p-4"
            >
              <div className="mb-3 h-4 w-32 animate-pulse rounded bg-borderSoft" />
              <div className="h-[200px] animate-pulse rounded bg-borderSoft" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
