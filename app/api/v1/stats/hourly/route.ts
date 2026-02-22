import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildHourlySeries } from '@/lib/adapter';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const scope = searchParams.get('scope') || 'canada';
        const items = await getIntelItems(scope as any);
        return NextResponse.json(buildHourlySeries(items));
    } catch (error) {
        console.error('Hourly stats error:', error);
        return NextResponse.json({ legend: [], xAxis: [], series: [] });
    }
}
