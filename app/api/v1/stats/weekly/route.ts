import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildWeeklySeries } from '@/lib/adapter';

export async function GET() {
    try {
        const items = await getIntelItems();
        return NextResponse.json(buildWeeklySeries(items));
    } catch (error) {
        console.error('Weekly stats error:', error);
        return NextResponse.json({ legend: [], xAxis: [], series: [] });
    }
}
