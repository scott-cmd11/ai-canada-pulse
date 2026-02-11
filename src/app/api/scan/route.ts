import { NextResponse } from 'next/server';
import { runFullScan } from '@/lib/scanners';
import { addIntelItems, updateLastScan } from '@/lib/storage';

async function executeScan() {
  const startTime = Date.now();
  const results = await runFullScan();

  const allItems = [
    ...results.news,
    ...results.research,
    ...results.policy,
    ...results.github,
    ...results.funding,
  ];

  const newItemsCount = await addIntelItems(allItems);
  await updateLastScan();

  const duration = Date.now() - startTime;

  return {
    success: true,
    duration: `${duration}ms`,
    itemsFound: allItems.length,
    newItems: newItemsCount,
    breakdown: {
      news: results.news.length,
      research: results.research.length,
      policy: results.policy.length,
      github: results.github.length,
      funding: results.funding.length,
    },
    errors: results.errors,
    timestamp: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await executeScan();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await executeScan();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
