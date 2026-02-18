import { NextResponse } from 'next/server';

// SSE is not supported on Vercel Serverless (10s timeout).
// The dashboard gracefully handles this by falling back to polling.
export async function GET() {
    return NextResponse.json(
        { error: 'SSE streaming is not available in this deployment' },
        { status: 501 },
    );
}
