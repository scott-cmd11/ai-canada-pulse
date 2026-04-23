import type { TopicContent } from "@/lib/topic-content"

const aida: TopicContent = {
    slug: "aida",
    updatedAt: "2026-04-23",
    explainerParagraphs: [
        "The Artificial Intelligence and Data Act — AIDA — was Canada's first serious attempt at a federal AI statute. Introduced in June 2022 as part of Bill C-27, it would have been one of the earliest comprehensive AI laws in any OECD country. It never became law: when Parliament was prorogued in January 2025, C-27 died on the order paper, and the bill has not been reintroduced since.",
        "AIDA did not regulate every AI system. Its obligations attached to what it called high-impact systems — a category that would have been defined in regulation rather than the act itself. Draft guidance from Innovation, Science and Economic Development Canada signalled criteria focused on employment, essential services, biometric identification, content moderation, and health applications. Developers, deployers, and operators of those systems would have faced duties around risk assessment, bias mitigation, record-keeping, and incident reporting.",
        "The law's reach depended heavily on regulations that were never finalised. The act delegated most of its operative detail — which systems counted as high-impact, what mitigation measures satisfied the duty of care, how enforcement would proceed — to secondary rulemaking. Critics argued this delegated too much to the executive branch. Supporters argued it was the only way to keep the law adaptable to a fast-moving field.",
        "After the April 2025 federal election returned a Liberal minority under Prime Minister Mark Carney, the government created a new portfolio — Minister of Artificial Intelligence and Digital Innovation — and named Evan Solomon to the role. Solomon has publicly signalled that AIDA will not return as drafted, and that any future AI framework will be 'light, tight, right' — decoupled from the privacy reform that sat alongside AIDA in C-27.",
        "As of April 2026, Canada has no comprehensive federal AI statute in force. Ottawa is working on a replacement framework under Minister Solomon's ministry, and provinces continue to move on their own rules in parallel. The AIDA story is now relevant mainly as the starting point — and cautionary template — for whatever comes next.",
    ],
    whyItMatters: [
        "AIDA will set the baseline rules for how Canadian businesses deploy AI in hiring, healthcare, financial services, and public-facing content — touching nearly every sector.",
        "The act's high-impact system definition, set by regulation, will determine whether Canadian rules stay interoperable with the EU AI Act or diverge into a parallel compliance track.",
        "The bill's delegated-rulemaking structure means the real policy fight is happening inside regulatory drafting, not just in Parliament — which shifts where stakeholders need to focus.",
    ],
    keyPeople: [
        {
            name: "Evan Solomon",
            role: "Minister of Artificial Intelligence and Digital Innovation",
            org: "Government of Canada",
        },
        {
            name: "Philippe Dufresne",
            role: "Privacy Commissioner of Canada",
            org: "OPC",
        },
        {
            name: "Yoshua Bengio",
            role: "Founder and Scientific Advisor",
            org: "Mila — architect of original AIDA testimony; now leads LawZero",
        },
    ],
    keyOrgs: [
        { label: "Innovation, Science and Economic Development Canada (ISED)", url: "https://ised-isde.canada.ca/" },
        { label: "Office of the Privacy Commissioner", url: "https://www.priv.gc.ca/" },
        { label: "Standing Committee on Industry and Technology (INDU)", url: "https://www.ourcommons.ca/Committees/en/INDU" },
    ],
    furtherReading: [
        {
            label: "Bill C-27 (44th Parliament, lapsed) — LEGISinfo historical record",
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
