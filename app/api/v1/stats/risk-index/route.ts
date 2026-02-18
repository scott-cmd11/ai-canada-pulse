import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildRiskIndex } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const items = await getIntelItems();
        return NextResponse.json(buildRiskIndex(items, tw));
    } catch (error) {
        console.error('Risk index error:', error);
        return NextResponse.json({ generated_at: new Date().toISOString(), time_window: '7d', score: 0, level: 'low', total: 0, incidents: 0, low_confidence: 0, high_alert_count: 0, incidents_ratio: 0, low_confidence_ratio: 0, combined_hhi: 0, reasons: ['Unable to compute'] });
    }
}
