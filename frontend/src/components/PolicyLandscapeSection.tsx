"use client"

const POLICIES = [
    {
        country: "European Union",
        flag: "🇪🇺",
        regulation: "EU AI Act",
        status: "In Force",
        statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        date: "Aug 2024",
        summary: "World's first comprehensive AI law. Risk-based framework classifying AI systems from minimal to unacceptable risk. Bans social scoring and real-time biometric surveillance with exceptions.",
        url: "https://artificialintelligenceact.eu/",
    },
    {
        country: "United States",
        flag: "🇺🇸",
        regulation: "Executive Order on AI Safety",
        status: "Revoked",
        statusColor: "bg-red-50 text-red-700 border-red-200",
        date: "Jan 2025",
        summary: "Biden's Oct 2023 executive order on safe AI was revoked by the Trump administration in Jan 2025. New policy focuses on removing barriers to American AI innovation and dominance.",
        url: "https://www.whitehouse.gov/briefings-statements/",
    },
    {
        country: "Canada",
        flag: "🇨🇦",
        regulation: "Artificial Intelligence and Data Act (AIDA)",
        status: "Proposed",
        statusColor: "bg-amber-50 text-amber-700 border-amber-200",
        date: "Jun 2022",
        summary: "Part of Bill C-27 (Digital Charter Implementation Act). Would regulate high-impact AI systems, require transparency, and establish an AI & Data Commissioner. Currently working through Parliament.",
        url: "https://ised-isde.canada.ca/site/innovation-better-canada/en/artificial-intelligence-and-data-act",
    },
    {
        country: "China",
        flag: "🇨🇳",
        regulation: "Multiple AI Regulations",
        status: "In Force",
        statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        date: "2023-2024",
        summary: "Separate regulations for recommendation algorithms (2022), deepfakes (2023), and generative AI (2023). Requires algorithm registration, content labeling, and security assessments before public release.",
        url: "https://digichina.stanford.edu/work/translation-measures-for-the-management-of-generative-ai-services/",
    },
    {
        country: "United Kingdom",
        flag: "🇬🇧",
        regulation: "Pro-Innovation AI Framework",
        status: "Active",
        statusColor: "bg-blue-50 text-blue-700 border-blue-200",
        date: "Mar 2023",
        summary: "Sector-specific, principles-based approach. No new AI-specific regulator. Existing regulators (FCA, Ofcom, CMA) apply AI principles within their domains. Established AI Safety Institute.",
        url: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach",
    },
    {
        country: "Japan",
        flag: "🇯🇵",
        regulation: "AI Guidelines for Business",
        status: "Active",
        statusColor: "bg-blue-50 text-blue-700 border-blue-200",
        date: "Apr 2024",
        summary: "Non-binding guidelines encouraging responsible AI development. Focus on international interoperability and supporting innovation while managing risk through industry self-governance.",
        url: "https://www.cas.go.jp/jp/seisaku/jinkouchinou/ai_business_guidelines.html",
    },
    {
        country: "South Korea",
        flag: "🇰🇷",
        regulation: "AI Framework Act",
        status: "In Force",
        statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        date: "Jan 2025",
        summary: "Classifies AI into high-impact and general categories. Requires transparency notifications, impact assessments for high-risk systems, and establishes an AI Committee for oversight.",
        url: "https://www.law.go.kr/",
    },
    {
        country: "India",
        flag: "🇮🇳",
        regulation: "National AI Strategy (AIFC)",
        status: "Active",
        statusColor: "bg-blue-50 text-blue-700 border-blue-200",
        date: "2024",
        summary: "Focuses on AI for social good with the IndiaAI Mission ($1.25B investment). No comprehensive AI law yet. Sector-specific advisories issued by MEITY for generative AI platforms.",
        url: "https://indiaai.gov.in/",
    },
]

export default function PolicyLandscapeSection() {
    return (
        <section>
            <div className="section-header">
                <h2>AI Policy Landscape</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {POLICIES.map((p) => (
                    <a
                        key={p.country}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="saas-card p-4 sm:p-5 hover:shadow-md transition-shadow group flex flex-col gap-2"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{p.flag}</span>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                                        {p.country}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500">{p.regulation}</p>
                                </div>
                            </div>
                            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${p.statusColor}`}>
                                {p.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            {p.summary}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-1">
                            <span className="text-[10px] text-slate-400 font-medium">{p.date}</span>
                            <span className="text-xs font-semibold text-indigo-700 group-hover:underline">
                                Details →
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    )
}
