import { NextResponse } from 'next/server';
import { runFullScan } from '@/lib/scanners';
import { addIntelItems, updateLastScan } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        // Optional authorization via CRON_SECRET
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await runFullScan();
        const allItems = [
            ...result.news,
            ...result.research,
            ...result.policy,
            ...result.github,
            ...result.funding,
        ];

        const inserted = await addIntelItems(allItems);
        await updateLastScan();

        return NextResponse.json({
            status: 'completed',
            task_id: `scan-${Date.now()}`,
            inserted,
            total_scanned: allItems.length,
            errors: result.errors,
        });
    } catch (error) {
        console.error('Scan error:', error);
        return NextResponse.json(
            { status: 'failed', error: String(error) },
            { status: 500 },
        );
    }
}
