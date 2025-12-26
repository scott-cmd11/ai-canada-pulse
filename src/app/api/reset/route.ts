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

    // Clear all grain intel keys
    await redis.del('grain_intel_items');
    await redis.del('grain_intel_last_scan');

    return NextResponse.json({
      success: true,
      message: 'Database cleared. Run a new scan to populate with filtered results.'
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
