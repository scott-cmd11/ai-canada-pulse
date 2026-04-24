import Header from "@/components/Header"
import QuotesArchive from "@/components/quotes/QuotesArchive"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Quotes · AI Canada Pulse",
  description:
    "Canadian government on artificial intelligence — an archive of on-the-record quotes from MPs, Senators, Ministers, Premiers, MLAs, and senior civil servants across federal, provincial, and executive branches.",
}

export default function QuotesPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
      <Header />
      <main className="mx-auto max-w-[960px] px-4 py-8 sm:px-6 lg:px-10">
        <header
          style={{ paddingBottom: "24px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "32px" }}
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
            Archive
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Canadian government on AI
          </h1>
          <p
            style={{
              marginTop: "10px",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              maxWidth: "640px",
            }}
          >
            On-the-record statements about artificial intelligence from federal MPs, Senators, and Ministers,
            provincial Premiers and MLAs (Ontario, Québec, B.C., Alberta), and senior civil servants.
            Sourced from Hansard, committee transcripts, and official press releases. Every quote is
            reviewed before publication.
          </p>
        </header>

        <QuotesArchive />
      </main>
    </div>
  )
}
