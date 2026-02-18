import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildAlerts } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tw = (searchParams.get('time_window') as TimeWindow) || '7d';
        const items = await getIntelItems();
        return NextResponse.json(buildAlerts(items, tw));
    } catch (error) {
        console.error('Alerts error:', error);
        return NextResponse.json({ generated_at: new Date().toISOString(), time_window: '7d', min_baseline: 5, min_delta_percent: 20, min_z_score: 1.5, lookback_windows: 4, alerts: [] });
    }
}
