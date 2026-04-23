import type { TopicContent } from "@/lib/topic-content"

const milaVectorAmii: TopicContent = {
    slug: "mila-vector-amii",
    updatedAt: "2026-04-23",
    explainerParagraphs: [
        "Canada's federally designated AI research ecosystem rests on three institutes: Mila in Montreal, the Vector Institute in Toronto, and Amii — the Alberta Machine Intelligence Institute — in Edmonton. Together they hold the majority of Canada's Canada CIFAR AI Chairs, train most domestic AI graduate students, and anchor the Pan-Canadian AI Strategy's talent mission.",
        "Mila, founded by Yoshua Bengio — who now serves as Founder and Scientific Advisor while leading the AI-safety nonprofit LawZero — is the largest of the three by headcount and publication output. Scientific direction at Mila is led by Hugo Larochelle, with Valérie Pisano as President and CEO. It operates as an academic institute affiliated with Université de Montréal and McGill, with close partnerships to HEC Montréal and Polytechnique. Its research centre of gravity is deep learning foundations, with dedicated programmes on AI for climate, health, and responsible AI.",
        "The Vector Institute in Toronto was founded in 2017 with a focus on applied research and industry engagement. It is now headquartered at the Schwartz Reisman Innovation Centre adjacent to the University of Toronto and is led by President and CEO Glenda Crisp. Vector operates a sponsor-member model that pulls in Canadian banks, telcos, and health systems as funders and research collaborators. Its applied MSc and Postgraduate Affiliate programmes have become a major on-ramp into Canadian industry AI teams.",
        "Amii in Edmonton — historically the home of Richard Sutton's reinforcement learning school — carries the deepest bench in RL and decision-making research in the country. It spun out of the University of Alberta and has been the most aggressive of the three in pursuing industrial R&D partnerships, including past collaborations with DeepMind and current work with natural-resource and public-sector sponsors across the Prairies.",
        "The institutes do not compete for the same work. They share the Canada CIFAR AI Chairs programme, coordinate on talent strategy through CIFAR, and increasingly join forces on cross-institute initiatives — AI safety research, regional compute allocation, and federal policy submissions. Following September 2025 federal consultations on the next phase of the Pan-Canadian AI Strategy, watching the three institutes together gives a better signal about where Canadian academic AI is heading than watching any one of them alone.",
    ],
    whyItMatters: [
        "The three institutes together account for the bulk of Canadian AI PhD output, making their hiring and retention a leading indicator of the next decade's talent pipeline.",
        "Their joint federal funding — now entering its next phase after September 2025 consultations on the Pan-Canadian AI Strategy — is the clearest signal of how Canada is choosing to compete with far larger US and Chinese research spending.",
        "Each institute anchors a regional ecosystem — Montreal, Toronto, and Edmonton-Calgary — so their health shapes startup formation, VC activity, and industry AI adoption across three distinct economies.",
    ],
    keyPeople: [
        { name: "Yoshua Bengio", role: "Founder and Scientific Advisor", org: "Mila — now also leads AI-safety nonprofit LawZero" },
        { name: "Hugo Larochelle", role: "Scientific Director", org: "Mila" },
        { name: "Valérie Pisano", role: "President and CEO", org: "Mila" },
        { name: "Glenda Crisp", role: "President and CEO", org: "Vector Institute" },
        { name: "Cam Linke", role: "CEO", org: "Amii" },
        { name: "Richard Sutton", role: "Chief Scientific Advisor", org: "Amii" },
    ],
    keyOrgs: [
        { label: "Mila — Quebec AI Institute", url: "https://mila.quebec/en/" },
        { label: "Vector Institute", url: "https://vectorinstitute.ai/" },
        { label: "Amii — Alberta Machine Intelligence Institute", url: "https://www.amii.ca/" },
        { label: "CIFAR (programme steward)", url: "https://cifar.ca/" },
    ],
    furtherReading: [
        {
            label: "Pan-Canadian AI Strategy — CIFAR",
            url: "https://cifar.ca/ai/",
        },
        {
            label: "Canada CIFAR AI Chairs directory",
            url: "https://cifar.ca/ai/canada-cifar-ai-chairs/",
        },
    ],
}

export default milaVectorAmii
