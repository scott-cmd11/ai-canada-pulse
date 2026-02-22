const fs = require('fs');

const p = 'c:/Users/scott/coding projects/ai-canada-pulse/lib/resources-registry.ts';
let content = fs.readFileSync(p, 'utf8');

const match = content.match(/export const resourcesRegistry: AIResource\[\] = (\[[\s\S]*?\]);/);
if (!match) process.exit(1);

const data = eval(match[1]);

const categories = [
    "AI in Government",
    "AI Institutes in Canada",
    "Intelligence Exponentials",
    "AI Evaluation & Progress",
    "Humanoid Robots",
    "AI/Robotics & Automation - Impact",
    "Popular AI Terms",
    "Quantum Computing",
    "Prompting",
    "Learning",
    "Deciding Use Cases / Adoption",
    "Governance",
    "Ethics",
    "Regulation",
    "Glasses & Wearables",
    "BCI & BMIs",
    "Safety & Security",
    "AI Agents vs. Agentic AI",
    "Agent Examples & Browsers",
    "Agent Adoption",
    "Emerging Research",
    "Agentic Engineering (Vibe Coding)",
    "Policy & Environment"
];

// Helper to check keywords against URL and Title
const matchesAny = (str, keywords) => keywords.some(k => str.toLowerCase().includes(k.toLowerCase()));

const assignCategory = (url, title) => {
    const t = title.toLowerCase();
    const u = url.toLowerCase();

    // 1. AI in Government
    if (matchesAny(u, ['canada.ca', '.gc.ca', 'omb.gov', 'csps-efpc', 'nrc.canada', 'policyhorizons']) || matchesAny(t, ['government', 'public service', 'canada.ca', 'csps'])) {
        if (!t.includes('quantum') && !t.includes('environment')) return "AI in Government";
    }
    // 2. AI Institutes in Canada
    if (matchesAny(t, ['amii', 'mila', 'vector institute', 'scale.ai', 'cifar'])) return "AI Institutes in Canada";

    // 3. Intelligence Exponentials
    if (matchesAny(t, ['wait but why', 'superintelligence', 'exponential', 'singularity'])) return "Intelligence Exponentials";

    // 4. AI Evaluation & Progress
    if (matchesAny(u, ['epochai.org', 'metr.org', 'arcprize', 'lmsys', 'bench', 'eval']) || matchesAny(t, ['benchmark', 'eval', 'leaderboard'])) return "AI Evaluation & Progress";

    // 5. Humanoid Robots
    if (matchesAny(t, ['humanoid', 'robot', 'figure 0', 'optimus', 'atlas', 'sanctuary ai', 'agility robotics'])) return "Humanoid Robots";

    // 6. Impact on Work
    if (matchesAny(t, ['impact on ai', 'workforce', 'labor', 'labour', 'job replacement', 'unemployment'])) return "AI/Robotics & Automation - Impact";

    // 7. Popular AI Terms -> "AGI", "RSI", "ASI"
    if (matchesAny(t, ['agi', 'asi', 'recursive self-improvement', 'artificial general intelligence'])) return "Popular AI Terms";

    // 8. Quantum
    if (matchesAny(t, ['quantum'])) return "Quantum Computing";

    // 9. Prompting
    if (matchesAny(t, ['prompt', 'prompting'])) return "Prompting";

    // 10. Learning
    if (matchesAny(t, ['learning hub', 'course', 'academy', '101', 'how to use'])) return "Learning";

    // 11. Deciding Use Cases
    if (matchesAny(t, ['use case', 'adoption', 'scale ai', 'scaling ai'])) return "Deciding Use Cases / Adoption";

    // 12. Governance
    if (matchesAny(t, ['governance'])) return "Governance";

    // 13. Ethics
    if (matchesAny(t, ['ethics', 'ethical', 'bias', 'justice'])) return "Ethics";

    // 14. Regulation
    if (matchesAny(t, ['regulation', 'sandbox', 'tracker', 'law'])) return "Regulation";

    // 15. Wearables
    if (matchesAny(t, ['glass', 'wearable', 'pin ', 'necklace'])) return "Glasses & Wearables";

    // 16. BCI
    if (matchesAny(t, ['bci', 'bmi', 'brain', 'neuralink'])) return "BCI & BMIs";

    // 17. Safety & Security
    if (matchesAny(t, ['safety', 'security', 'caisi', 'aisi', 'risk'])) return "Safety & Security";

    // 18. AI Agents vs Agentic AI
    if (matchesAny(t, ['agentic ai', 'vs', 'what are ai agents'])) return "AI Agents vs. Agentic AI";

    // 19. Agent Examples & Browsers
    if (matchesAny(t, ['agent example', 'browser', 'copilot', 'devin', 'operator', 'computer use', 'project astra'])) return "Agent Examples & Browsers";

    // 20. Agent Adoption
    if (matchesAny(t, ['agent adoption', 'pwc'])) return "Agent Adoption";

    // 21. Emerging Research
    if (matchesAny(u, ['arxiv.org', 'huggingface.co']) || matchesAny(t, ['research', 'paper', 'nature', 'science', 'self-teaching', 'reward'])) return "Emerging Research";

    // 22. Vibe Coding
    if (matchesAny(t, ['vibe coding', 'agentic engineering', 'cursor', 'windsurf'])) return "Agentic Engineering (Vibe Coding)";

    // 23. Policy & Environment
    if (matchesAny(t, ['policy', 'environment', 'energy', 'footprint', 'emissions'])) return "Policy & Environment";

    // Fallback
    return "AI in Government";
};

// Enrich data
const enriched = data.map(r => {
    const newCat = assignCategory(r.url, r.title);
    return { ...r, category: newCat };
});

const newRegistry = 'export interface AIResource {\n  id: string;\n  title: string;\n  url: string;\n  category: string;\n  description: string;\n}\n\nexport const resourcesRegistry: AIResource[] = ' + JSON.stringify(enriched, null, 2) + ';';

fs.writeFileSync(p, newRegistry);
console.log('Registry recategorized to 23 categories successfully.');
