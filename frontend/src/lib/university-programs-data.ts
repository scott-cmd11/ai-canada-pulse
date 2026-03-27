// Canadian university AI programs — curated dataset
// Sources:
// - Individual university program pages
// - CIFAR Pan-Canadian AI Strategy reports
//
// ⚠  REFRESH SCHEDULE: This file contains static data that needs manual updates.
//    - Check university program pages annually
//    - Last verified: March 2026

export interface UniversityProgram {
  institution: string
  program: string
  degree: "BSc" | "MSc" | "PhD" | "Certificate" | "Diploma"
  province: string
  provinceSlug: string
  url: string
  notable?: string
}

export const UNIVERSITY_PROGRAMS: UniversityProgram[] = [
  // Ontario
  { institution: "University of Toronto", program: "Machine Intelligence", degree: "MSc", province: "Ontario", provinceSlug: "ontario", url: "https://web.cs.toronto.edu", notable: "Hinton's home department; Vector Institute affiliation" },
  { institution: "University of Toronto", program: "Computer Science (AI Focus)", degree: "PhD", province: "Ontario", provinceSlug: "ontario", url: "https://web.cs.toronto.edu" },
  { institution: "University of Toronto", program: "Applied Computing — AI Specialization", degree: "MSc", province: "Ontario", provinceSlug: "ontario", url: "https://mscac.utoronto.ca" },
  { institution: "University of Waterloo", program: "Artificial Intelligence", degree: "MSc", province: "Ontario", provinceSlug: "ontario", url: "https://uwaterloo.ca/artificial-intelligence-group", notable: "Strong co-op integration with AI industry" },
  { institution: "University of Waterloo", program: "Data Science", degree: "MSc", province: "Ontario", provinceSlug: "ontario", url: "https://uwaterloo.ca/data-science" },
  { institution: "University of Ottawa", program: "Computer Science — AI Stream", degree: "MSc", province: "Ontario", provinceSlug: "ontario", url: "https://www.uottawa.ca/faculty-engineering/school-electrical-engineering-computer-science" },
  { institution: "Queen's University", program: "Computing — AI Specialization", degree: "MSc", province: "Ontario", provinceSlug: "ontario", url: "https://www.cs.queensu.ca" },
  { institution: "Western University", program: "Artificial Intelligence", degree: "MSc", province: "Ontario", provinceSlug: "ontario", url: "https://www.csd.uwo.ca" },

  // Quebec
  { institution: "Université de Montréal", program: "Machine Learning", degree: "MSc", province: "Quebec", provinceSlug: "quebec", url: "https://diro.umontreal.ca", notable: "Yoshua Bengio's department; Mila affiliation" },
  { institution: "Université de Montréal", program: "Computer Science (Deep Learning)", degree: "PhD", province: "Quebec", provinceSlug: "quebec", url: "https://diro.umontreal.ca" },
  { institution: "McGill University", program: "Computer Science — AI Area", degree: "MSc", province: "Quebec", provinceSlug: "quebec", url: "https://www.cs.mcgill.ca", notable: "Mila affiliated; strong RL and NLP groups" },
  { institution: "McGill University", program: "Computer Science — AI Area", degree: "PhD", province: "Quebec", provinceSlug: "quebec", url: "https://www.cs.mcgill.ca" },
  { institution: "Polytechnique Montréal", program: "Applied AI", degree: "Certificate", province: "Quebec", provinceSlug: "quebec", url: "https://www.polymtl.ca" },
  { institution: "Université Laval", program: "Artificial Intelligence", degree: "MSc", province: "Quebec", provinceSlug: "quebec", url: "https://www.ulaval.ca" },

  // British Columbia
  { institution: "University of British Columbia", program: "Computer Science — ML/AI", degree: "MSc", province: "British Columbia", provinceSlug: "british-columbia", url: "https://www.cs.ubc.ca", notable: "Strong computer vision and robotics groups" },
  { institution: "University of British Columbia", program: "Computer Science — ML/AI", degree: "PhD", province: "British Columbia", provinceSlug: "british-columbia", url: "https://www.cs.ubc.ca" },
  { institution: "Simon Fraser University", program: "Computing Science — AI Specialization", degree: "MSc", province: "British Columbia", provinceSlug: "british-columbia", url: "https://www.sfu.ca/computing.html" },
  { institution: "University of Victoria", program: "Computer Science", degree: "MSc", province: "British Columbia", provinceSlug: "british-columbia", url: "https://www.uvic.ca/ecs/computerscience" },

  // Alberta
  { institution: "University of Alberta", program: "Computing Science — AI/ML", degree: "MSc", province: "Alberta", provinceSlug: "alberta", url: "https://www.ualberta.ca/computing-science", notable: "Amii affiliation; world-leading RL research (Rich Sutton)" },
  { institution: "University of Alberta", program: "Computing Science — AI/ML", degree: "PhD", province: "Alberta", provinceSlug: "alberta", url: "https://www.ualberta.ca/computing-science" },
  { institution: "University of Alberta", program: "Statistical Machine Learning", degree: "MSc", province: "Alberta", provinceSlug: "alberta", url: "https://www.ualberta.ca/mathematical-and-statistical-sciences" },
  { institution: "University of Calgary", program: "Data Science and Analytics", degree: "MSc", province: "Alberta", provinceSlug: "alberta", url: "https://science.ucalgary.ca/data-science" },

  // Saskatchewan
  { institution: "University of Saskatchewan", program: "Computer Science", degree: "MSc", province: "Saskatchewan", provinceSlug: "saskatchewan", url: "https://cs.usask.ca", notable: "AI applications in agriculture and health" },

  // Manitoba
  { institution: "University of Manitoba", program: "Computer Science — AI/ML", degree: "MSc", province: "Manitoba", provinceSlug: "manitoba", url: "https://sci.umanitoba.ca/cs" },
  { institution: "University of Manitoba", program: "Data Science", degree: "MSc", province: "Manitoba", provinceSlug: "manitoba", url: "https://sci.umanitoba.ca/cs" },

  // Nova Scotia
  { institution: "Dalhousie University", program: "Computer Science — AI", degree: "MSc", province: "Nova Scotia", provinceSlug: "nova-scotia", url: "https://www.dal.ca/faculty/computerscience.html", notable: "Ocean technology AI applications" },

  // New Brunswick
  { institution: "University of New Brunswick", program: "Computer Science", degree: "MSc", province: "New Brunswick", provinceSlug: "new-brunswick", url: "https://www.unb.ca/cic", notable: "Canadian Institute for Cybersecurity" },

  // Newfoundland & Labrador
  { institution: "Memorial University of Newfoundland", program: "Computer Science", degree: "MSc", province: "Newfoundland & Labrador", provinceSlug: "newfoundland-labrador", url: "https://www.mun.ca/computerscience", notable: "Ocean science and offshore AI applications" },

  // Prince Edward Island
  { institution: "University of Prince Edward Island", program: "Computer Science", degree: "BSc", province: "Prince Edward Island", provinceSlug: "prince-edward-island", url: "https://www.upei.ca/programs/computer-science" },
]

export function getProgramsByProvince(provinceSlug: string): UniversityProgram[] {
  return UNIVERSITY_PROGRAMS.filter((p) => p.provinceSlug === provinceSlug)
}

export function getProgramStats() {
  const byProvince = UNIVERSITY_PROGRAMS.reduce<Record<string, number>>((acc, p) => {
    acc[p.province] = (acc[p.province] || 0) + 1
    return acc
  }, {})

  const byDegree = UNIVERSITY_PROGRAMS.reduce<Record<string, number>>((acc, p) => {
    acc[p.degree] = (acc[p.degree] || 0) + 1
    return acc
  }, {})

  return {
    total: UNIVERSITY_PROGRAMS.length,
    institutions: new Set(UNIVERSITY_PROGRAMS.map((p) => p.institution)).size,
    byProvince,
    byDegree,
  }
}
