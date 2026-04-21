import { ImageResponse } from "next/og"
import { getTopicBySlug, TOPICS } from "@/lib/topics"

export const runtime = "edge"
export const alt = "AI Canada Pulse — Topic"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
    return TOPICS.map((t) => ({ slug: t.slug }))
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const topic = getTopicBySlug(slug)
    const label = topic?.label ?? "Topic"
    const category = topic?.category ?? "AI Canada Pulse"
    const lede = topic?.heroLede ?? "Tracking AI developments across Canada."

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "72px 80px",
                    background: "#fafaf8",
                    fontFamily: "sans-serif",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        color: "#c2410c",
                        fontSize: 22,
                        fontWeight: 800,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                    }}
                >
                    <div style={{ width: 14, height: 14, background: "#c2410c", borderRadius: 2 }} />
                    AI Canada Pulse
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div
                        style={{
                            color: "#c2410c",
                            fontSize: 20,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                        }}
                    >
                        {category}
                    </div>
                    <div
                        style={{
                            color: "#111",
                            fontSize: label.length > 36 ? 72 : 84,
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.05,
                            display: "flex",
                        }}
                    >
                        {label}
                    </div>
                    <div
                        style={{
                            color: "#555",
                            fontSize: 28,
                            lineHeight: 1.45,
                            maxWidth: 960,
                            display: "flex",
                        }}
                    >
                        {lede}
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 20,
                        color: "#888",
                    }}
                >
                    <div>aicanadapulse.ca/topics/{slug}</div>
                    <div style={{ color: "#c2410c", fontWeight: 700 }}>Topic brief</div>
                </div>
            </div>
        ),
        { ...size },
    )
}
