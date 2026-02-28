import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildSummary } from '@/lib/adapter';
import { generateAiSummary } from '@/lib/hf-summarize';
import type { TimeWindow, SummaryResponse } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const scope = searchParams.get('scope') || 'canada';
        const items = await getIntelItems(scope as any);

        // Try AI-powered summary first
        const articleInputs = items.slice(0, 20).map((item) => ({
            title: item.title,
            category: item.category ?? item.type ?? 'unknown',
            jurisdiction: item.region ?? 'Canada',
            publisher: item.source ?? 'Unknown',
        }));

        const aiBullets = await generateAiSummary(articleInputs, tw);

        if (aiBullets && aiBullets.length > 0) {
            const response: SummaryResponse = {
                generated_at: new Date().toISOString(),
                time_window: tw,
                bullets: aiBullets,
            };
            return NextResponse.json(response);
        }

        // Fallback to template-based summary
        return NextResponse.json(buildSummary(items, tw));
    } catch (error) {
        console.error('AI Summary error:', error);
        return NextResponse.json({
            generated_at: new Date().toISOString(),
            time_window: '7d',
            bullets: [],
        });
    }
}
