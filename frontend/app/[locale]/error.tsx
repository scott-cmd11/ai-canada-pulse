"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <AlertTriangle
          size={48}
          className="mx-auto mb-4"
          style={{ color: "var(--incidents)" }}
        />
        <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
        <p className="mb-6 text-sm text-textSecondary">
          An unexpected error occurred while loading the dashboard. This may be
          a temporary issue with the data service.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded border border-borderStrong px-4 py-2 text-sm font-medium hover:bg-bg"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}
