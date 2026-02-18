import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildJurisdictionsBreakdown } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const items = await getIntelItems();
        return NextResponse.json(buildJurisdictionsBreakdown(items, tw));
    } catch (error) {
        console.error('Jurisdictions breakdown error:', error);
        return NextResponse.json({ time_window: '7d', total: 0, jurisdictions: [] });
    }
}
