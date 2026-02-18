import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildMomentum } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const items = await getIntelItems();
        return NextResponse.json(buildMomentum(items, tw));
    } catch (error) {
        console.error('Momentum error:', error);
        return NextResponse.json({ generated_at: new Date().toISOString(), time_window: '7d', categories: [], publishers: [] });
    }
}
