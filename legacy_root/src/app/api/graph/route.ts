import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/storage';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, graph: stats.relationshipGraph });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
