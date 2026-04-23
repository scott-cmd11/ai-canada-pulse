import type { TopicContent } from "@/lib/topic-content"

const computeCapacity: TopicContent = {
    slug: "compute-capacity",
    updatedAt: "2026-04-23",
    explainerParagraphs: [
        "Canadian AI compute capacity spans three distinct tiers: hyperscale cloud regions operated by Amazon, Microsoft, Google, and Oracle; federally-funded academic high-performance computing operated by the Digital Research Alliance of Canada; and a growing colocation and sovereign-compute layer serving startups, enterprises, and government buyers who want Canadian-domiciled infrastructure.",
        "At the hyperscale tier, AWS, Microsoft Azure, and Google Cloud all operate Canadian regions anchored in Toronto and Montreal, with AWS having added a Calgary region to its footprint. Each carries the standard suite of AI accelerators — NVIDIA H100, H200, and more recently B200/Blackwell GPUs, Google TPUs, and Trainium/Inferentia on AWS. Capacity allocations to Canadian customers compete with global demand, which means scheduled GPU availability has been a recurring bottleneck since 2023.",
        "Academic compute runs through the Digital Research Alliance's national systems. The older generation — Cedar, Graham, and Béluga — has been retired and replaced by a new fleet including Fir (SFU), Rorqual (ÉTS/Calcul Québec), Nibi (Waterloo), and the Trillium system. Institute-specific clusters at Mila, Vector, and Amii sit alongside. The federal Pan-Canadian AI Compute Strategy, first announced in late 2024 at roughly $2 billion and expanded to approximately $2.4 billion through 2026, committed significant capital toward expanding this tier, with a fraction earmarked for a sovereign compute capability available to Canadian-headquartered firms. In April 2026, ISED opened intake for the AI Sovereign Compute Infrastructure Program — the procurement vehicle that will actually commission new Canadian supercomputing capacity.",
        "Sovereign compute has become the defining policy question. The argument for building dedicated Canadian AI supercomputers — rather than renting hyperscaler capacity — turns on data residency, export-control exposure, and strategic autonomy. The counter-argument centres on cost per FLOP, speed to market, and whether domestic operators can actually secure near-term GPU allocations in a market where the largest US hyperscalers have locked up most of Nvidia's forward production.",
        "Power and location now drive where new capacity lands. Hydro-rich Quebec and Manitoba dominate new colocation builds, and the Alberta government has moved aggressively to position the province as an AI data centre hub using natural-gas power and cold climate. Expect land acquisition, grid connection queues, and municipal planning approvals to become the binding constraints on capacity growth through the late 2020s.",
    ],
    whyItMatters: [
        "Compute capacity is the hard floor on what Canadian labs and startups can actually build — no other policy lever matters if the GPUs don't exist domestically.",
        "Where data centres physically land affects provincial economies, grid planning, and water use for decades, making this as much a land-use and energy story as a technology one.",
        "Sovereign compute decisions taken in 2026–2027 will lock in Canada's AI infrastructure posture for a generation, either anchoring domestic capability or entrenching dependence on US hyperscalers.",
    ],
    keyPeople: [
        {
            name: "Aidan Gomez",
            role: "Co-founder and CEO",
            org: "Cohere — a flagship domestic compute customer",
        },
        {
            name: "Raquel Urtasun",
            role: "Founder and CEO",
            org: "Waabi — autonomous-vehicle compute user",
        },
    ],
    keyOrgs: [
        { label: "Digital Research Alliance of Canada", url: "https://alliancecan.ca/" },
        { label: "Pan-Canadian AI Compute Strategy — ISED", url: "https://ised-isde.canada.ca/site/ised/en/canadian-sovereign-ai-compute-strategy" },
        { label: "Canada Infrastructure Bank", url: "https://cib-bic.ca/" },
    ],
    furtherReading: [
        {
            label: "AI Canada Pulse — Data Centres Map",
            url: "/datacentres",
        },
        {
            label: "AI Sovereign Compute Infrastructure Program — ISED (April 2026)",
            url: "https://ised-isde.canada.ca/site/ised/en/canadian-sovereign-ai-compute-strategy",
        },
    ],
}

export default computeCapacity
