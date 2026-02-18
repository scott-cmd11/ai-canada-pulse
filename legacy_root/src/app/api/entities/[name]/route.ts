import { NextResponse } from 'next/server';
import { getEntitySummary } from '@/lib/storage';

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  try {
    const params = await context.params;
    const name = decodeURIComponent(params.name || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Missing entity name' }, { status: 400 });
    }

    const summary = await getEntitySummary(name);
    if (!summary) {
      return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, entity: summary });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
