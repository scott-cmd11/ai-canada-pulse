import AILabel from "@/components/AILabel"
import type { TopicContent } from "@/lib/topic-content"

interface Props {
    content: TopicContent
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h2
            style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                marginTop: "32px",
                marginBottom: "14px",
            }}
        >
            {children}
        </h2>
    )
}

export default function TopicExplainer({ content }: Props) {
    return (
        <section style={{ maxWidth: "680px" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                }}
            >
                <AILabel level="classification" />
                <span style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                    Explainer · AI-drafted, human-reviewed
                </span>
            </div>

            <div
                style={{
                    fontSize: "15px",
                    lineHeight: 1.75,
                    color: "var(--text-secondary)",
                }}
            >
                {content.explainerParagraphs.map((para, i) => (
                    <p key={i} style={{ marginBottom: "14px" }}>
                        {para}
                    </p>
                ))}
            </div>

            {content.whyItMatters.length > 0 && (
                <>
                    <SectionHeading>Why this matters</SectionHeading>
                    <ul
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            fontSize: "15px",
                            lineHeight: 1.6,
                            color: "var(--text-secondary)",
                            paddingLeft: "18px",
                            margin: 0,
                            listStyle: "disc",
                        }}
                    >
                        {content.whyItMatters.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                        ))}
                    </ul>
                </>
            )}

            {content.keyPeople.length > 0 && (
                <>
                    <SectionHeading>Key people</SectionHeading>
                    <ul
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            fontSize: "14px",
                            lineHeight: 1.5,
                            color: "var(--text-secondary)",
                            margin: 0,
                            listStyle: "none",
                            padding: 0,
                        }}
                    >
                        {content.keyPeople.map((p, i) => (
                            <li key={i}>
                                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{p.name}</span>
                                {" — "}
                                <span>{p.role}</span>
                                {p.org && (
                                    <>
                                        <span style={{ color: "var(--text-muted)" }}> · {p.org}</span>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {content.keyOrgs.length > 0 && (
                <>
                    <SectionHeading>Key organisations</SectionHeading>
                    <ul
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            fontSize: "14px",
                            lineHeight: 1.5,
                            margin: 0,
                            listStyle: "none",
                            padding: 0,
                        }}
                    >
                        {content.keyOrgs.map((o, i) => (
                            <li key={i}>
                                <a
                                    href={o.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}
                                    className="hover:underline"
                                >
                                    {o.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {content.furtherReading.length > 0 && (
                <>
                    <SectionHeading>Further reading</SectionHeading>
                    <ul
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            fontSize: "14px",
                            lineHeight: 1.5,
                            margin: 0,
                            listStyle: "none",
                            padding: 0,
                        }}
                    >
                        {content.furtherReading.map((r, i) => {
                            const internal = r.url.startsWith("/")
                            return (
                                <li key={i}>
                                    <a
                                        href={r.url}
                                        {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                                        style={{
                                            color: "var(--accent-primary)",
                                            textDecoration: "none",
                                            fontWeight: 600,
                                        }}
                                        className="hover:underline"
                                    >
                                        {r.label}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </>
            )}
        </section>
    )
}
