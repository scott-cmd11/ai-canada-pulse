import type { TopicContent } from "@/lib/topic-content"

const regionalEcosystems: TopicContent = {
    slug: "regional-ecosystems",
    updatedAt: "2026-04-18",
    explainerParagraphs: [
        "Canada's AI story is regional. The national aggregate — research output, company formation, hiring, funding — is the sum of four to five distinct city-scale ecosystems, each with its own character, anchor institutions, and economic incentives. Treating the country as one market obscures more than it reveals.",
        "Toronto is the commercial centre. The MaRS Discovery District hosts the Vector Institute, and the surrounding Financial District concentrates AI teams at the Big Five banks, Shopify, and most publicly-traded Canadian tech employers. Toronto leads the country in enterprise AI deployment, venture funding, and raw headcount. Its weakness is that it pulls talent from across Canada into a single expensive metro.",
        "Montreal is the research centre. Mila, Université de Montréal, McGill, and HEC anchor a deep-learning research cluster that is competitive with any in the world. The city also hosts a distinctive entertainment-AI cluster — Ubisoft, Unity, and Element AI's alumni-founded startups — that you won't find elsewhere in Canada. French-language talent flow from European francophone countries is a structural advantage.",
        "Edmonton — with Calgary as an increasingly important secondary node — anchors the Prairie AI ecosystem around Amii and the University of Alberta. The Edmonton-Calgary corridor dominates Canadian reinforcement learning research and has a distinctive applied-AI scene aligned with energy, agriculture, and public-sector sponsors. Alberta's aggressive data-centre incentives and cheap power are shifting the infrastructure side of the Prairie story.",
        "Vancouver is the applied and emerging hub. The University of British Columbia and Simon Fraser University supply a steady stream of AI talent, and the city's proximity to Seattle — both as competitor and hiring partner — shapes its character. Vancouver's ecosystem skews toward computer vision, robotics, and gaming, with Waterloo contributing a parallel engineering-heavy ecosystem centred on autonomous systems and foundation-model infrastructure. Ottawa and Atlantic Canada each host smaller but strategically important government and research-aligned AI activity.",
    ],
    whyItMatters: [
        "Provincial and municipal policy — not just federal — shapes each ecosystem's growth, making regional variation a direct consequence of subnational choices about tax, talent, and infrastructure.",
        "Each region has a different specialisation, so the right federal AI strategy is necessarily a composite of regional strengths rather than a single national programme.",
        "Talent mobility between regions — and between Canadian regions and US metros — is one of the most important leading indicators of where Canadian AI capability is consolidating.",
    ],
    keyPeople: [],
    keyOrgs: [
        { label: "MaRS Discovery District (Toronto)", url: "https://www.marsdd.com/" },
        { label: "Communitech (Kitchener-Waterloo)", url: "https://www.communitech.ca/" },
        { label: "Centech (Montreal)", url: "https://centech.co/en/" },
        { label: "Platform Calgary", url: "https://platformcalgary.com/" },
    ],
    furtherReading: [
        {
            label: "AI Canada Pulse — Dashboard (regional breakdowns)",
            url: "/dashboard",
        },
    ],
}

export default regionalEcosystems
