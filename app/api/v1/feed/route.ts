import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { buildFeedResponse } from '@/lib/adapter';
import type { TimeWindow } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const scope = searchParams.get('scope') || 'canada';
        const items = await getIntelItems(scope as any);

        const response = buildFeedResponse(items, {
            page: Number(searchParams.get('page')) || 1,
            page_size: Number(searchParams.get('page_size')) || 50,
            time_window: (searchParams.get('time_window') as TimeWindow) || undefined,
            category: searchParams.get('category') || undefined,
            jurisdiction: searchParams.get('jurisdiction') || undefined,
            search: searchParams.get('search') || undefined,
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error('Feed error:', error);
        return NextResponse.json({ items: [], page: 1, page_size: 50, total: 0 });
    }
}
