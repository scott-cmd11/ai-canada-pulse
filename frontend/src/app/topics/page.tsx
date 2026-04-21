import Header from "@/components/Header"
import TopicIndex from "@/components/TopicIndex"
import { TOPICS } from "@/lib/topics"
import { readDashboardEnrichment } from "@/lib/ai-enrichment-cache"

// Counts come from the latest enrichment bundle and update on each cron refresh.
export const dynamic = "force-dynamic"

export const metadata = {
    title: "Topics",
    description:
        "Browse AI Canada Pulse by topic — policy, infrastructure, research, applications, and ecosystem signals across 20 canonical areas of Canadian AI.",
}

async function readCounts(): Promise<Record<string, number>> {
    try {
        const payload = await readDashboardEnrichment("canada")
        const counts: Record<string, number> = {}
        if (payload?.topics) {
            for (const tags of Object.values(payload.topics)) {
                for (const slug of tags) {
                    counts[slug] = (counts[slug] ?? 0) + 1
                }
            }
        }
        return counts
    } catch {
        return {}
    }
}

export default async function TopicsPage() {
    const counts = await readCounts()

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
                        Browse
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
                        All topics
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
                        {TOPICS.length} canonical areas of Canadian AI — each with its own feed, explainer, and data
                        view. Counts reflect stories tagged in the last refresh cycle.
                    </p>
                </header>

                <TopicIndex counts={counts} />
            </main>
        </div>
    )
}
