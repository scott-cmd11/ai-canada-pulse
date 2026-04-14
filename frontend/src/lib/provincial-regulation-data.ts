// Provincial and federal AI regulation — curated dataset
// Sources:
// - LEGISinfo (parl.ca), provincial legislature websites
// - Office of the Privacy Commissioner of Canada
// - Provincial privacy commissioners
//
// ⚠  REFRESH SCHEDULE: This file contains static data that needs manual updates.
//    - Check LEGISinfo for bill status changes: https://www.parl.ca/legisinfo/
//    - Check provincial legislature websites quarterly
//    - Last verified: March 2026

export type RegulationStatus = "In Force" | "Royal Assent" | "Committee Stage" | "Second Reading" | "First Reading" | "Proposed" | "Consultation" | "Died on Order Paper"

export type RegulationType = "Legislation" | "Framework" | "Guideline" | "Privacy Law" | "Directive"

export interface RegulationItem {
  id: string
  name: string
  jurisdiction: string
  jurisdictionSlug: string
  status: RegulationStatus
  type: RegulationType
  description: string
  effectiveDate: string | null
  url: string
  aiRelevance: "Direct" | "Indirect"
}

export const REGULATIONS: RegulationItem[] = [
  // Federal
  {
    id: "c27-aida",
    name: "Bill C-27 — Artificial Intelligence and Data Act (AIDA)",
    jurisdiction: "Federal",
    jurisdictionSlug: "federal",
    status: "Died on Order Paper",
    type: "Legislation",
    description: "Part 3 of the Digital Charter Implementation Act. Would have established a regulatory framework for AI systems in Canada with risk-based requirements, prohibited conduct, and an AI Commissioner.",
    effectiveDate: null,
    url: "https://www.parl.ca/legisinfo/en/bill/44-1/c-27",
    aiRelevance: "Direct",
  },
  {
    id: "directive-aia",
    name: "Directive on Automated Decision-Making",
    jurisdiction: "Federal",
    jurisdictionSlug: "federal",
    status: "In Force",
    type: "Directive",
    description: "Treasury Board directive requiring federal departments to complete Algorithmic Impact Assessments before deploying AI systems. Mandatory since April 2019.",
    effectiveDate: "2019-04-01",
    url: "https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=32592",
    aiRelevance: "Direct",
  },
  {
    id: "guide-genai",
    name: "Guide on the Use of Generative AI",
    jurisdiction: "Federal",
    jurisdictionSlug: "federal",
    status: "In Force",
    type: "Guideline",
    description: "Federal guidance for public servants on responsible use of generative AI tools. Covers data classification, prompt engineering, and output validation.",
    effectiveDate: "2023-09-01",
    url: "https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/guide-use-generative-ai.html",
    aiRelevance: "Direct",
  },
  {
    id: "pipeda",
    name: "PIPEDA — Personal Information Protection and Electronic Documents Act",
    jurisdiction: "Federal",
    jurisdictionSlug: "federal",
    status: "In Force",
    type: "Privacy Law",
    description: "Canada's federal private-sector privacy law. Governs how AI systems collect, use, and disclose personal information. OPC has issued AI-specific guidance.",
    effectiveDate: "2000-01-01",
    url: "https://laws-lois.justice.gc.ca/eng/acts/P-8.6/",
    aiRelevance: "Indirect",
  },
  {
    id: "voluntary-code",
    name: "Voluntary Code of Conduct for Generative AI",
    jurisdiction: "Federal",
    jurisdictionSlug: "federal",
    status: "In Force",
    type: "Guideline",
    description: "ISED-led voluntary commitments for generative AI developers and deployers. Covers safety, transparency, and fairness. Signed by major tech companies operating in Canada.",
    effectiveDate: "2023-09-01",
    url: "https://ised-isde.canada.ca/site/ised/en/voluntary-code-conduct-responsible-development-and-management-advanced-generative-ai-systems",
    aiRelevance: "Direct",
  },

  // Quebec
  {
    id: "qc-law25",
    name: "Quebec Law 25 (Bill 64) — Modernizing Privacy Legislation",
    jurisdiction: "Quebec",
    jurisdictionSlug: "quebec",
    status: "In Force",
    type: "Privacy Law",
    description: "Comprehensive privacy reform with AI implications: mandatory privacy impact assessments for automated decision systems, right to explanation of algorithmic decisions, consent requirements.",
    effectiveDate: "2023-09-22",
    url: "https://www.cai.gouv.qc.ca/loi-25/",
    aiRelevance: "Direct",
  },
  {
    id: "qc-ai-strategy",
    name: "Quebec AI Strategy",
    jurisdiction: "Quebec",
    jurisdictionSlug: "quebec",
    status: "In Force",
    type: "Framework",
    description: "Provincial strategy committing $329M for AI development, with focus on responsible AI, Mila support, and talent retention.",
    effectiveDate: "2023-01-01",
    url: "https://www.quebec.ca/en/government/policies-orientations/plan-action-intelligence-artificielle",
    aiRelevance: "Direct",
  },

  // Ontario
  {
    id: "on-trustworthy-ai",
    name: "Ontario Trustworthy AI Framework",
    jurisdiction: "Ontario",
    jurisdictionSlug: "ontario",
    status: "In Force",
    type: "Framework",
    description: "Provincial framework for responsible AI use in the Ontario Public Service. Principles: transparency, accountability, fairness, safety, and human oversight.",
    effectiveDate: "2024-01-01",
    url: "https://www.ontario.ca/page/ontarios-trustworthy-artificial-intelligence-ai-framework",
    aiRelevance: "Direct",
  },

  // British Columbia
  {
    id: "bc-fippa",
    name: "BC FIPPA Amendments — Automated Decision Systems",
    jurisdiction: "British Columbia",
    jurisdictionSlug: "british-columbia",
    status: "Consultation",
    type: "Privacy Law",
    description: "Proposed amendments to the Freedom of Information and Protection of Privacy Act to address automated decision-making by public bodies.",
    effectiveDate: null,
    url: "https://www.oipc.bc.ca",
    aiRelevance: "Indirect",
  },

  // Alberta
  {
    id: "ab-pipa",
    name: "Alberta PIPA — AI and Automated Decision Guidance",
    jurisdiction: "Alberta",
    jurisdictionSlug: "alberta",
    status: "In Force",
    type: "Guideline",
    description: "Alberta's privacy commissioner has issued guidance on how PIPA applies to AI systems and automated decision-making in the private sector.",
    effectiveDate: "2024-06-01",
    url: "https://www.oipc.ab.ca",
    aiRelevance: "Indirect",
  },

  // Nova Scotia
  {
    id: "ns-ai-governance-team",
    name: "Nova Scotia Government AI Team & Responsible AI Framework",
    jurisdiction: "Nova Scotia",
    jurisdictionSlug: "nova-scotia",
    status: "In Force",
    type: "Framework",
    description: "The Province of Nova Scotia established a dedicated 5-person AI team in 2025 to guide responsible AI adoption across government departments. The 2026-27 provincial budget allocates $4.4M for AI capabilities development and public service modernisation.",
    effectiveDate: "2025-01-01",
    url: "https://novascotia.ca/news/",
    aiRelevance: "Direct",
  },
  {
    id: "ns-scottie-ai-chatbot",
    name: "Scottie — Nova Scotia Government AI Assistant",
    jurisdiction: "Nova Scotia",
    jurisdictionSlug: "nova-scotia",
    status: "In Force",
    type: "Guideline",
    description: "Nova Scotia launched 'Scottie', an AI-powered chatbot pilot for government services, as part of its AI modernisation agenda. The initiative includes guidelines on responsible AI use in public-facing government services.",
    effectiveDate: "2025-06-01",
    url: "https://novascotia.ca/news/",
    aiRelevance: "Direct",
  },
]

export function getRegulationsByJurisdiction(slug: string): RegulationItem[] {
  return REGULATIONS.filter((r) => r.jurisdictionSlug === slug)
}

export function getDirectAIRegulations(): RegulationItem[] {
  return REGULATIONS.filter((r) => r.aiRelevance === "Direct")
}

export function getRegulationsByStatus(): Record<RegulationStatus, RegulationItem[]> {
  return REGULATIONS.reduce<Record<string, RegulationItem[]>>((acc, r) => {
    if (!acc[r.status]) acc[r.status] = []
    acc[r.status].push(r)
    return acc
  }, {}) as Record<RegulationStatus, RegulationItem[]>
}
