import Header from "@/components/Header"
import PageHero from "@/components/PageHero"
import TopicIndex from "@/components/TopicIndex"
import { TOPICS, TOPIC_CATEGORIES } from "@/lib/topics"
import { readDashboardEnrichment } from "@/lib/ai-enrichment-cache"

// Counts come from the latest enrichment bundle and update on each cron refresh.
export const dynamic = "force-dynamic"

export const metadata = {
    title: "Topics",
    description:
        "Browse AI Canada Pulse by topic - policy, infrastructure, research, applications, and ecosystem signals across 20 canonical areas of Canadian AI.",
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
            <main className="page-main-narrow">
                <PageHero
                    eyebrow="Browse"
                    title={<>All <span>topics</span></>}
                    description={`${TOPICS.length} canonical areas of Canadian AI, each with its own feed, explainer, and data view. Counts reflect stories tagged in the last refresh cycle.`}
                    stats={[
                        { label: "Areas", value: `${TOPICS.length}` },
                        { label: "Groups", value: `${TOPIC_CATEGORIES.length}` },
                        { label: "Refresh", value: "Live" },
                    ]}
                />

                <div className="page-section">
                    <TopicIndex counts={counts} />
                </div>
            </main>
        </div>
    )
}
