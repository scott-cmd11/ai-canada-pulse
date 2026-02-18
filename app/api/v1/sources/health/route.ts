import { NextResponse } from 'next/server';

// Source health endpoint — returns a static snapshot.
// In production, this would be populated by scanner run results.
export async function GET() {
    return NextResponse.json({
        updated_at: new Date().toISOString(),
        run_status: 'idle',
        inserted_total: 0,
        candidates_total: 0,
        skipped_lock_count: 0,
        sources: [],
    });
}
