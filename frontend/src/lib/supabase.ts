// frontend/src/lib/supabase.ts
// Lazy-init Supabase client (server-side only).
// Returns null when env vars are missing — safe during Next.js build prerendering.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  client = createClient(url, key)
  return client
}
