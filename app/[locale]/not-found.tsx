import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p
          className="mb-2 text-6xl font-bold"
          style={{ color: "var(--text-muted)" }}
        >
          404
        </p>
        <h2 className="mb-2 text-xl font-semibold">Page not found</h2>
        <p className="mb-6 text-sm text-textSecondary">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/en/canada"
          className="inline-flex items-center gap-2 rounded border border-borderStrong px-4 py-2 text-sm font-medium hover:bg-bg"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
