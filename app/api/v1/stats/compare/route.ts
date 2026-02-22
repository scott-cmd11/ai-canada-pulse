import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildScopeCompare } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const pCanada = getIntelItems('canada');
        const pWorld = getIntelItems('world');
        const [canadaItems, worldItems] = await Promise.all([pCanada, pWorld]);
        const items = [...canadaItems, ...worldItems];
        return NextResponse.json(buildScopeCompare(items, tw));
    } catch (error) {
        console.error('Scope compare error:', error);
        return NextResponse.json({ generated_at: new Date().toISOString(), time_window: '7d', total: 0, canada: 0, global: 0, other: 0, categories: [] });
    }
}
