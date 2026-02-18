import { NextResponse } from 'next/server';
import { getIntelItems } from '@/lib/storage';
import { toFeedItem } from '@/lib/adapter';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'json';
        const items = await getIntelItems();
        const feedItems = items.map(toFeedItem);

        if (format === 'csv') {
            const headers = ['id', 'title', 'publisher', 'category', 'published_at', 'url', 'jurisdiction'];
            const rows = feedItems.map((i) =>
                headers.map((h) => `"${String((i as unknown as Record<string, unknown>)[h] || '').replace(/"/g, '""')}"`).join(','),
            );
            const csv = [headers.join(','), ...rows].join('\n');
            return new NextResponse(csv, {
                headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=feed.csv' },
            });
        }

        return NextResponse.json({ items: feedItems, total: feedItems.length });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ items: [], total: 0 });
    }
}
