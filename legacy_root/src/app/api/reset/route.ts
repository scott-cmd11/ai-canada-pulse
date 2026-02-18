import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST() {
  try {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 500 });
    }

    const redis = new Redis({ url, token });

    await redis.del('canada_ai_intel_items');
    await redis.del('canada_ai_intel_last_scan');

    return NextResponse.json({
      success: true,
      message: 'Canada AI dashboard cache cleared. Run /api/scan to repopulate.',
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
