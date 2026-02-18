import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildSourcesBreakdown } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const items = await getIntelItems();
        return NextResponse.json(buildSourcesBreakdown(items, tw));
    } catch (error) {
        console.error('Sources breakdown error:', error);
        return NextResponse.json({ time_window: '7d', total: 0, publishers: [], source_types: [] });
    }
}
