import type { TimeWindow } from "../../lib/types";

export const categoryColor: Record<string, string> = {
  policy: "var(--policy)",
  research: "var(--research)",
  industry: "var(--industry)",
  funding: "var(--funding)",
  news: "var(--news)",
  incidents: "var(--incidents)",
};

export const CANADA_JURISDICTIONS = new Set([
  "canada",
  "national",
  "federal",
  "ontario",
  "quebec",
  "alberta",
  "british columbia",
  "manitoba",
  "saskatchewan",
  "nova scotia",
  "new brunswick",
  "newfoundland and labrador",
  "prince edward island",
  "northwest territories",
  "nunavut",
  "yukon",
]);

export function isCanadaJurisdiction(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return CANADA_JURISDICTIONS.has(normalized);
}

export type FilterPreset = {
  id: string;
  name: string;
  timeWindow: TimeWindow;
  category: string;
  jurisdiction: string;
  language: string;
  search: string;
};

export type ScenarioPreset = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  mode: "policy" | "research";
  timeWindow: TimeWindow;
  category: string;
  jurisdiction: string;
  language: string;
  search: string;
};

export type SavedBrief = {
  id: string;
  createdAt: string;
  markdown: string;
};

export function concentrationTone(level: string): string {
  if (level === "high") return "var(--incidents)";
  if (level === "medium") return "var(--warning)";
  return "var(--research)";
}

export const confidenceTone: Record<string, string> = {
  very_high: "var(--research)",
  high: "var(--policy)",
  medium: "var(--warning)",
  low: "var(--incidents)",
};

// Plain-language display names for API category values
export const CATEGORY_DISPLAY: Record<string, string> = {
  policy:    "Government",
  research:  "Science & Tech",
  industry:  "Business",
  funding:   "Grants",
  news:      "In the News",
  incidents: "Alerts",
  "":        "All Topics",
};

// Plain-language confidence label replacing raw percentage
export function confidenceLabel(score: number): { label: string; color: string } {
  if (score >= 0.8) return { label: "Strong match",  color: "var(--research)" };
  if (score >= 0.5) return { label: "Good match",    color: "var(--policy)" };
  if (score >= 0.3) return { label: "Partial match", color: "var(--warning)" };
  return               { label: "Possible match", color: "var(--incidents)" };
}
