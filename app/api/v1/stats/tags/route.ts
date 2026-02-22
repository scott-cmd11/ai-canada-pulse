import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildTagsBreakdown } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const scope = searchParams.get('scope') || 'canada';
        const items = await getIntelItems(scope as any);
        return NextResponse.json(buildTagsBreakdown(items, tw));
    } catch (error) {
        console.error('Tags breakdown error:', error);
        return NextResponse.json({ time_window: '7d', total: 0, tags: [] });
    }
}
