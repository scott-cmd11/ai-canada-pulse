import Header from "@/components/Header"
import PageHero from "@/components/PageHero"
import QuotesArchive from "@/components/quotes/QuotesArchive"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Quotes - AI Canada Pulse",
  description:
    "Canadian government on artificial intelligence - an archive of on-the-record quotes from MPs, Senators, Ministers, Premiers, MLAs, and senior civil servants across federal, provincial, and executive branches.",
}

export default function QuotesPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
      <Header />
      <main className="page-main-narrow">
        <PageHero
          eyebrow="Archive"
          title={<>Government <span>on AI</span></>}
          description="On-the-record statements about artificial intelligence from federal MPs, Senators, Ministers, provincial leaders, and senior civil servants. Sourced from Hansard, committee transcripts, and official press releases."
          stats={[
            { label: "Source", value: "Public record" },
            { label: "Scope", value: "Canada" },
            { label: "Review", value: "Manual" },
          ]}
        />

        <div className="page-section">
          <QuotesArchive />
        </div>
      </main>
    </div>
  )
}
