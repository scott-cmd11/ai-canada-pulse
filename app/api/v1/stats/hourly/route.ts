import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildHourlySeries } from '@/lib/adapter';

export async function GET() {
    try {
        const items = await getIntelItems();
        return NextResponse.json(buildHourlySeries(items));
    } catch (error) {
        console.error('Hourly stats error:', error);
        return NextResponse.json({ legend: [], xAxis: [], series: [] });
    }
}
