"use client"

const POLICIES = [
    {
        country: "European Union",
        flag: "🇪🇺",
        regulation: "EU AI Act",
        status: "In Force",
        statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        date: "Aug 2024",
        summary: "World's first comprehensive AI law. Risk-based framework classifying AI systems from minimal to unacceptable risk. Bans social scoring and real-time biometric surveillance with exceptions. Phased enforcement continues through 2026.",
        url: "https://artificialintelligenceact.eu/",
    },
    {
        country: "United States",
        flag: "🇺🇸",
        regulation: "AI Action Plan & Executive Orders",
        status: "Active",
        statusColor: "bg-blue-50 text-blue-700 border-blue-200",
        date: "Jul 2025",
        summary: "Biden's 2023 AI safety EO was revoked in Jan 2025. Replaced by America's AI Action Plan (Jul 2025) and multiple executive orders focused on removing regulatory barriers, accelerating data center permitting, and promoting AI exports.",
        url: "https://www.whitehouse.gov/briefings-statements/",
    },
    {
        country: "Canada",
        flag: "🇨🇦",
        regulation: "Artificial Intelligence and Data Act (AIDA)",
        status: "Dead",
        statusColor: "bg-slate-100 text-slate-600 border-slate-300",
        date: "Jan 2025",
        summary: "Bill C-27, which included AIDA, died in Parliament following prorogation in Jan 2025. Canada currently has no dedicated federal AI law. The Canadian AI Safety Institute (CAISI) was established in Nov 2024 to advance responsible AI.",
        url: "https://ised-isde.canada.ca/site/innovation-better-canada/en/artificial-intelligence-and-data-act",
    },
    {
        country: "China",
        flag: "🇨🇳",
        regulation: "Multiple AI Regulations",
        status: "In Force",
        statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        date: "2022–2024",
        summary: "Separate regulations for recommendation algorithms (2022), deepfakes (2023), and generative AI (2023). Requires algorithm registration, content labeling, and security assessments before public release.",
        url: "https://digichina.stanford.edu/work/translation-measures-for-the-management-of-generative-ai-services/",
    },
    {
        country: "United Kingdom",
        flag: "🇬🇧",
        regulation: "Pro-Innovation AI Framework",
        status: "Active",
        statusColor: "bg-blue-50 text-blue-700 border-blue-200",
        date: "2023–2026",
        summary: "Sector-specific, principles-based approach. AI Safety Institute rebranded as AI Security Institute (Feb 2025). Data (Use and Access) Act passed mid-2025. A comprehensive AI Bill is anticipated in 2026.",
        url: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach",
    },
    {
        country: "Japan",
        flag: "🇯🇵",
        regulation: "AI Promotion Act",
        status: "In Force",
        statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        date: "Sep 2025",
        summary: "Japan's first dedicated AI law, enacted May 2025 and fully effective Sep 2025. Establishes an AI Strategic Headquarters chaired by the PM. Adopts a soft-law approach focused on cooperation over penalties. AI Basic Plan adopted Dec 2025.",
        url: "https://www.cas.go.jp/jp/seisaku/jinkouchinou/",
    },
    {
        country: "South Korea",
        flag: "🇰🇷",
        regulation: "AI Framework Act",
        status: "In Force",
        statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        date: "Jan 2026",
        summary: "Promulgated Jan 2025, fully enforced Jan 2026. Classifies AI into high-impact and general categories. Requires transparency notifications, impact assessments for high-risk systems, and establishes an AI Committee for oversight.",
        url: "https://www.law.go.kr/",
    },
    {
        country: "India",
        flag: "🇮🇳",
        regulation: "IndiaAI Mission & Governance Guidelines",
        status: "Active",
        statusColor: "bg-blue-50 text-blue-700 border-blue-200",
        date: "Nov 2025",
        summary: "IndiaAI Mission ($1.25B investment) with 38,000+ GPUs onboarded. AI Governance Guidelines released Nov 2025. New rules on synthetic content / deepfakes effective Feb 2026. No comprehensive AI law yet.",
        url: "https://indiaai.gov.in/",
    },
]

export default function PolicyLandscapeSection() {
    return (
        <section>

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
