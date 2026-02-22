const fs = require('fs');
const path = require('path');

const statsDir = 'c:/Users/scott/coding projects/ai-canada-pulse/app/api/v1/stats';
const dirs = fs.readdirSync(statsDir);

dirs.forEach(d => {
    const p = path.join(statsDir, d, 'route.ts');
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');

        // Add request: Request to GET if missing
        if (content.includes('export async function GET() {')) {
            content = content.replace('export async function GET() {', 'export async function GET(request: Request) {');
        }

        // Check if we already extract searchParams
        const hasURL = content.includes('new URL(request.url)');

        if (!hasURL) {
            if (content.includes('const items = await getIntelItems();')) {
                content = content.replace('const items = await getIntelItems();',
                    `const { searchParams } = new URL(request.url);\n        const scope = searchParams.get('scope') || 'canada';\n        const items = await getIntelItems(scope as any);`);
            }
        } else {
            if (content.includes('const items = await getIntelItems();')) {
                content = content.replace('const items = await getIntelItems();',
                    `const scope = searchParams.get('scope') || 'canada';\n        const items = await getIntelItems(scope as any);`);
            }
        }

        fs.writeFileSync(p, content);
    }
});

// Also fix app/api/v1/feed/route.ts
const feedPath = 'c:/Users/scott/coding projects/ai-canada-pulse/app/api/v1/feed/route.ts';
if (fs.existsSync(feedPath)) {
    let content = fs.readFileSync(feedPath, 'utf8');
    if (content.includes('const items = await getIntelItems();')) {
        content = content.replace('const items = await getIntelItems();',
            `const scope = searchParams.get('scope') || 'canada';\n        const items = await getIntelItems(scope as any);`);
        fs.writeFileSync(feedPath, content);
    }
}

console.log('Done mapping routes');
