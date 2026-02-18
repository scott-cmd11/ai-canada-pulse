import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildBrief } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const items = await getIntelItems();
        return NextResponse.json(buildBrief(items, tw));
    } catch (error) {
        console.error('Brief error:', error);
        return NextResponse.json({ generated_at: new Date().toISOString(), time_window: '7d', total_items: 0, high_alert_count: 0, top_category: { name: 'none', count: 0 }, top_jurisdiction: { name: 'none', count: 0 }, top_publisher: { name: 'none', count: 0 }, top_tag: { name: 'none', count: 0 } });
    }
}
