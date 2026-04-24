import Header from "@/components/Header"
import ReviewQueue from "@/components/quotes/ReviewQueue"
import { isAdminKeyValid } from "@/lib/quotes/admin-auth"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Quotes review · AI Canada Pulse",
  robots: { index: false, follow: false },
}

export default function AdminQuotesPage({
  searchParams,
}: {
  searchParams: { key?: string }
}) {
  const key = searchParams.key
  if (!isAdminKeyValid(key)) notFound()

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
      <Header />
      <main className="mx-auto max-w-[1040px] px-4 py-8 sm:px-6 lg:px-10">
        <header
          style={{ paddingBottom: "20px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "28px" }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent-primary)",
              marginBottom: "8px",
            }}
          >
            Admin · Quotes review
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Pending quotes
          </h1>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
            Review automated candidates before they appear on the public archive.
          </p>
        </header>

        <ReviewQueue adminKey={key as string} />
      </main>
    </div>
  )
}
