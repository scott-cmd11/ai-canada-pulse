import type { TopicContent } from "@/lib/topic-content"

const aida: TopicContent = {
    slug: "aida",
    updatedAt: "2026-04-18",
    explainerParagraphs: [
        "The Artificial Intelligence and Data Act — AIDA — is Canada's proposed federal law governing how high-impact AI systems are designed, deployed, and monitored. It was introduced in June 2022 as part of Bill C-27, alongside two parallel pieces of privacy legislation. If passed, it would be the first comprehensive federal AI statute in Canadian history and one of the earliest such laws in any OECD country.",
        "AIDA does not regulate every AI system. Its obligations attach to what it calls high-impact systems — a category defined in regulation rather than the act itself. Draft guidance from Innovation, Science and Economic Development Canada has signalled that criteria will focus on employment, essential services, biometric identification, content moderation, and health applications. Developers, deployers, and operators of these systems would face duties around risk assessment, bias mitigation, record-keeping, and incident reporting.",
        "The law's practical reach depends heavily on regulations that have not been finalised. The act delegates most of its operative detail — which systems count as high-impact, what mitigation measures satisfy the duty of care, how enforcement actually proceeds — to secondary rulemaking. Critics argue this delegates too much to the executive branch. Supporters argue it's the only way to keep the law adaptable to a fast-moving field.",
        "Enforcement would flow through a new AI and Data Commissioner, housed within ISED. The Commissioner would have audit and order-making powers, and could levy administrative monetary penalties. Criminal offences for the most serious violations — including knowingly using unlawfully obtained data to train an AI system — sit alongside the administrative regime.",
        "As of early 2026 the bill remains at committee stage in Parliament, with industry, academic, and civil-society groups actively submitting amendments. The timeline is uncertain: between parliamentary arithmetic, the interaction with the EU AI Act, and proposals to split AIDA out of C-27 entirely, the final shape of Canadian federal AI regulation is still being negotiated.",
    ],
    whyItMatters: [
        "AIDA will set the baseline rules for how Canadian businesses deploy AI in hiring, healthcare, financial services, and public-facing content — touching nearly every sector.",
        "The act's high-impact system definition, set by regulation, will determine whether Canadian rules stay interoperable with the EU AI Act or diverge into a parallel compliance track.",
        "The bill's delegated-rulemaking structure means the real policy fight is happening inside regulatory drafting, not just in Parliament — which shifts where stakeholders need to focus.",
    ],
    keyPeople: [
        {
            name: "François-Philippe Champagne",
            role: "Minister of Innovation, Science and Industry",
            org: "Government of Canada",
        },
        {
            name: "Philippe Dufresne",
            role: "Privacy Commissioner of Canada",
            org: "OPC",
        },
        {
            name: "Yoshua Bengio",
            role: "Scientific Director",
            org: "Mila — frequent AIDA witness",
        },
    ],
    keyOrgs: [
        { label: "Innovation, Science and Economic Development Canada (ISED)", url: "https://ised-isde.canada.ca/" },
        { label: "Office of the Privacy Commissioner", url: "https://www.priv.gc.ca/" },
        { label: "Standing Committee on Industry and Technology (INDU)", url: "https://www.ourcommons.ca/Committees/en/INDU" },
    ],
    furtherReading: [
        {
            label: "Bill C-27 — Parliament of Canada (full text)",
            url: "https://www.parl.ca/LegisInfo/en/bill/44-1/c-27",
        },
        {
            label: "AIDA Companion Document — ISED",
            url: "https://ised-isde.canada.ca/site/innovation-better-canada/en/artificial-intelligence-and-data-act-aida-companion-document",
        },
        {
            label: "OpenParliament.ca — C-27 debate history",
            url: "https://openparliament.ca/bills/44-1/C-27/",
        },
    ],
}

export default aida
