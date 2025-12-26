import { NextResponse } from 'next/server';
import { runFullScan } from '@/lib/scanners';
import { addIntelItems, updateLastScan } from '@/lib/storage';

// This endpoint is called by Vercel Cron every 6 hours
export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting intelligence scan...');
    const startTime = Date.now();

    // Run all scanners
    const results = await runFullScan();

    // Combine all items
    const allItems = [
      ...results.news,
      ...results.research,
      ...results.github,
      ...results.patents
    ];

    // Add to storage (deduplicates automatically)
    const newItemsCount = await addIntelItems(allItems);

    // Update last scan timestamp
    await updateLastScan();

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      duration: `${duration}ms`,
      itemsFound: allItems.length,
      newItems: newItemsCount,
      breakdown: {
        news: results.news.length,
        research: results.research.length,
        github: results.github.length,
        patents: results.patents.length
      },
      errors: results.errors,
      timestamp: new Date().toISOString()
    };

    console.log('Scan complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Scan failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Allow manual triggering via POST
export async function POST(request: Request) {
  return GET(request);
}
