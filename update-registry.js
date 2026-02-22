const fs = require('fs');

const p = 'c:/Users/scott/coding projects/ai-canada-pulse/lib/resources-registry.ts';
let content = fs.readFileSync(p, 'utf8');

const match = content.match(/export const resourcesRegistry: AIResource\[\] = (\[[\s\S]*?\]);/);
if (!match) process.exit(1);

const data = eval(match[1]);

const urlCat = (url, original) => {
  const u = url.toLowerCase();
  if (u.includes('.gov') || u.includes('canada.ca') || u.includes('.gc.ca') || u.includes('omb.gov')) return 'Government & Policy';
  if (u.includes('github.com') || u.includes('huggingface.co') || u.includes('arxiv.org')) return 'Models & Repositories';
  if (u.includes('substack.com') || u.includes('news') || u.includes('blog') || u.includes('magazine')) return 'Media & Newsletters';
  if (u.includes('bench') || u.includes('eval') || u.includes('leaderboard') || u.includes('scale.com') || u.includes('epochai.org')) return 'Evaluation & Benchmarks';
  
  if (original === 'Models & Robotics') return 'Models & Repositories'; // Standardize naming
  return 'Research & Institutes'; // Fallback
};

// Enrich data
const enriched = data.map(r => {
  let hostname = '';
  try {
    hostname = new URL(r.url).hostname.replace('www.', '');
  } catch (e) {
    hostname = r.url;
  }
  
  const newCat = urlCat(r.url, r.category);

  let desc = r.description;
  if (desc.startsWith('Explore')) {
      if (newCat === 'Government & Policy') {
          desc = "Official policy document or government resource from " + hostname + ".";
      } else if (newCat === 'Models & Repositories') {
          desc = "Open-source codebase, model weights, or technical repository hosted on " + hostname + ".";
      } else if (newCat === 'Media & Newsletters') {
          desc = "Article, newsletter, or press release published on " + hostname + ".";
      } else if (newCat === 'Evaluation & Benchmarks') {
          desc = "Testing framework, leaderboard, or evaluation dataset from " + hostname + ".";
      } else {
          desc = "Research publication, institutional link, or general AI resource by " + hostname + ".";
      }
  }

  return { ...r, category: newCat, description: desc };
});

const newRegistry = 'export interface AIResource {\n  id: string;\n  title: string;\n  url: string;\n  category: string;\n  description: string;\n}\n\nexport const resourcesRegistry: AIResource[] = ' + JSON.stringify(enriched, null, 2) + ';';

fs.writeFileSync(p, newRegistry);
console.log('Registry updated successfully.');
