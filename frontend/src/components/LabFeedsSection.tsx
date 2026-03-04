"use client"

const LABS = [
    {
        name: "Mila: Quebec AI Institute",
        description: "World-leading research lab in deep learning and reinforcement learning. Co-founded by Yoshua Bengio.",
        url: "https://mila.quebec/en/publications",
        location: "Montréal, QC",
        color: "bg-blue-50 border-blue-200 text-blue-800",
        iconColor: "text-blue-600",
    },
    {
        name: "Vector Institute",
        description: "Ontario's flagship AI research institute focused on machine learning applications in healthcare, finance, and industry.",
        url: "https://vectorinstitute.ai/research/publications/",
        location: "Toronto, ON",
        color: "bg-emerald-50 border-emerald-200 text-emerald-800",
        iconColor: "text-emerald-600",
    },
    {
        name: "CIFAR: Pan-Canadian AI Strategy",
        description: "Funds Canada's National AI Strategy and supports fundamental research across AI safety, learning algorithms, and societal impact.",
        url: "https://cifar.ca/ai-society-publications/",
        location: "Toronto, ON (National)",
        color: "bg-violet-50 border-violet-200 text-violet-800",
        iconColor: "text-violet-600",
    },
    {
        name: "Amii: Alberta Machine Intelligence Institute",
        description: "Alberta's AI institute advancing reinforcement learning and AI for scientific discovery. Home to Rich Sutton's research group.",
        url: "https://www.amii.ca/research/",
        location: "Edmonton, AB",
        color: "bg-amber-50 border-amber-200 text-amber-800",
        iconColor: "text-amber-600",
    },
]

export default function LabFeedsSection() {
    return (
        <section>
            <div className="section-header">
                <h2>Canadian AI Lab Updates</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LABS.map((lab) => (
                    <a
                        key={lab.name}
                        href={lab.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="saas-card p-4 sm:p-5 hover:shadow-md transition-shadow group flex flex-col gap-2"
                    >
                        <div className="flex items-start justify-between">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                                {lab.name}
                            </h3>
                            <span className={`shrink-0 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${lab.color}`}>
                                {lab.location}
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            {lab.description}
                        </p>
                        <span className="text-xs font-semibold text-indigo-700 group-hover:underline mt-auto">
                            View publications →
                        </span>
                    </a>
                ))}
            </div>
        </section>
    )
}
