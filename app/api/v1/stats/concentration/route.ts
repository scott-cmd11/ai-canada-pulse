import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildConcentration } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const scope = searchParams.get('scope') || 'canada';
        const items = await getIntelItems(scope as any);
        return NextResponse.json(buildConcentration(items, tw));
    } catch (error) {
        console.error('Concentration error:', error);
        return NextResponse.json({ generated_at: new Date().toISOString(), time_window: '7d', total: 0, source_hhi: 0, source_level: 'low', jurisdiction_hhi: 0, jurisdiction_level: 'low', category_hhi: 0, category_level: 'low', combined_hhi: 0, combined_level: 'low', top_sources: [], top_jurisdictions: [] });
    }
}
