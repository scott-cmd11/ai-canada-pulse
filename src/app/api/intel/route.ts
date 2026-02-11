import { NextResponse } from 'next/server';
import {
  getIntelItems,
  getItemsByEntity,
  getItemsByRegion,
  getItemsBySource,
  getItemsByType,
  getItemsByWatchlist,
  searchItems,
} from '@/lib/storage';
import { IntelType } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as IntelType | null;
    const entity = searchParams.get('entity');
    const region = searchParams.get('region');
    const source = searchParams.get('source');
    const query = searchParams.get('q');
    const watchlist = searchParams.get('watchlist');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let items;

    if (query) {
      items = await searchItems(query, limit);
    } else if (watchlist) {
      items = await getItemsByWatchlist(watchlist, limit);
    } else if (type) {
      items = await getItemsByType(type, limit);
    } else if (entity) {
      items = await getItemsByEntity(entity, limit);
    } else if (region) {
      items = await getItemsByRegion(region, limit);
    } else if (source) {
      items = await getItemsBySource(source, limit);
    } else {
      items = (await getIntelItems()).slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error('Error fetching intel:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
