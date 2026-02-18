import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildKPIs } from '@/lib/adapter';

export async function GET() {
    try {
        const items = await getIntelItems();
        return NextResponse.json(buildKPIs(items));
    } catch (error) {
        console.error('KPI error:', error);
        return NextResponse.json({ m15: { current: 0, previous: 0, delta_percent: 0 }, h1: { current: 0, previous: 0, delta_percent: 0 }, d7: { current: 0, previous: 0, delta_percent: 0 } });
    }
}
