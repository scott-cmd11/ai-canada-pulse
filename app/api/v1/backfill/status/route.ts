import { NextResponse } from 'next/server';

// Backfill status — returns idle since there's no persistent worker.
// Scans are triggered via POST /api/v1/backfill/run.
export async function GET() {
    return NextResponse.json({
        state: 'idle',
        checked_at: new Date().toISOString(),
    });
}
