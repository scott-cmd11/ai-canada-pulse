/**
 * Plain-English definitions for dashboard terms.
 * Used by TooltipHelp component and the Methods page.
 */
export const glossary: Record<string, { en: string; fr: string }> = {
  signal: {
    en: "A piece of AI-related information detected from one of our data sources — like a news article, research paper, or government announcement.",
    fr: "Une information liee a l'IA detectee dans l'une de nos sources de donnees, comme un article de presse, un document de recherche ou une annonce gouvernementale.",
  },
  confidence: {
    en: "How sure the system is that this signal is relevant to Canadian AI, on a scale from 0 to 100%. Higher means more likely to be relevant.",
    fr: "Le degre de certitude du systeme que ce signal est pertinent pour l'IA canadienne, sur une echelle de 0 a 100 %.",
  },
  entityMomentum: {
    en: "Shows which organizations, people, or topics are being mentioned more (or less) compared to the previous time period.",
    fr: "Montre quelles organisations, personnes ou sujets sont mentionnes plus (ou moins) par rapport a la periode precedente.",
  },
  jurisdiction: {
    en: "The province, territory, or country a signal is associated with. Helps you filter for your region of interest.",
    fr: "La province, le territoire ou le pays auquel un signal est associe.",
  },
  sourceHealth: {
    en: "The operational status of each data source. Shows whether sources are actively providing data and how recently they were updated.",
    fr: "L'etat operationnel de chaque source de donnees. Indique si les sources fournissent activement des donnees.",
  },
  riskIndex: {
    en: "A composite score (0-100) that combines incident reports, low-confidence signals, and data concentration to estimate the overall risk level.",
    fr: "Un score composite (0-100) qui combine les rapports d'incidents, les signaux de faible confiance et la concentration des donnees.",
  },
  riskTrend: {
    en: "How the risk index has changed over time. Rising trends may indicate emerging safety concerns or data quality issues.",
    fr: "Comment l'indice de risque a evolue au fil du temps.",
  },
  concentration: {
    en: "Measures how spread out the signals are across sources, categories, and regions. High concentration means most signals come from a few sources.",
    fr: "Mesure la repartition des signaux entre les sources, les categories et les regions.",
  },
  momentum: {
    en: "Compares the current period with the previous one to show which categories and publishers are trending up or down.",
    fr: "Compare la periode actuelle avec la precedente pour montrer les tendances.",
  },
  coverageMatrix: {
    en: "A breakdown of how many signals fall into each category, source type, language, and jurisdiction.",
    fr: "Une ventilation du nombre de signaux dans chaque categorie, type de source, langue et juridiction.",
  },
  sourceFreshness: {
    en: "How recently each data source was last checked. 'Fresh' means checked within 20 minutes, 'Aging' within 60 minutes, 'Stale' means over 60 minutes.",
    fr: "Quand chaque source de donnees a ete verifiee pour la derniere fois.",
  },
  sourceQuality: {
    en: "A quality grade (A-D) based on acceptance rate, insert efficiency, duplicate rate, and error rate for each data source.",
    fr: "Une note de qualite (A-D) basee sur le taux d'acceptation et l'efficacite de chaque source.",
  },
  backfill: {
    en: "The process of importing historical data from past time periods. This fills in older signals that predate the dashboard's launch.",
    fr: "Le processus d'importation de donnees historiques des periodes passees.",
  },
  alerts: {
    en: "Notifications triggered when a category's signal volume spikes or drops significantly compared to the previous period.",
    fr: "Notifications declenchees lorsque le volume de signaux d'une categorie augmente ou diminue considerablement.",
  },
  briefSnapshot: {
    en: "A quick summary showing the top category, jurisdiction, publisher, and tag for the selected time window.",
    fr: "Un resume rapide montrant la categorie, la juridiction, l'editeur et le tag principaux.",
  },
  scopeCompare: {
    en: "Shows how signal volume is split between Canada-specific signals and global signals.",
    fr: "Montre comment le volume de signaux est reparti entre les signaux specifiques au Canada et les signaux mondiaux.",
  },
  hourlyChart: {
    en: "A timeline chart showing how many signals were detected each hour over the last 24 hours, broken down by category.",
    fr: "Un graphique chronologique montrant combien de signaux ont ete detectes chaque heure au cours des 24 dernieres heures.",
  },
  weeklyChart: {
    en: "A bar chart showing signal volume per week over the past 12 weeks, broken down by category.",
    fr: "Un graphique a barres montrant le volume de signaux par semaine au cours des 12 dernieres semaines.",
  },
};

export type GlossaryKey = keyof typeof glossary;

/**
 * Get the plain-English definition for a glossary term.
 */
export function getDefinition(key: GlossaryKey, locale: string = "en"): string {
  const entry = glossary[key];
  if (!entry) return "";
  return locale === "fr" ? entry.fr : entry.en;
}
