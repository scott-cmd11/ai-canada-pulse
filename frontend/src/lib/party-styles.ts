// Shared party chip styles. Used by ParliamentSection and the Quotes feature.
// Keys must match the normalised party names produced by ingestion (see parliament-client.ts PARTY_MAP).

import type { CSSProperties } from "react"

export const PARTY_STYLES: Record<string, CSSProperties> = {
  Liberal:          { backgroundColor: 'color-mix(in srgb, #ef4444 12%, var(--surface-primary))', color: '#b91c1c', border: '1px solid color-mix(in srgb, #ef4444 20%, var(--surface-primary))' },
  Conservative:     { backgroundColor: 'color-mix(in srgb, #3b82f6 12%, var(--surface-primary))', color: '#1d4ed8', border: '1px solid color-mix(in srgb, #3b82f6 20%, var(--surface-primary))' },
  NDP:              { backgroundColor: 'color-mix(in srgb, #f59e0b 12%, var(--surface-primary))', color: '#b45309', border: '1px solid color-mix(in srgb, #f59e0b 20%, var(--surface-primary))' },
  "Bloc Québécois": { backgroundColor: 'color-mix(in srgb, #0ea5e9 12%, var(--surface-primary))', color: '#0369a1', border: '1px solid color-mix(in srgb, #0ea5e9 20%, var(--surface-primary))' },
  Green:            { backgroundColor: 'color-mix(in srgb, #22c55e 12%, var(--surface-primary))', color: '#15803d', border: '1px solid color-mix(in srgb, #22c55e 20%, var(--surface-primary))' },
  // Provincial-only parties
  CAQ:              { backgroundColor: 'color-mix(in srgb, #60a5fa 12%, var(--surface-primary))', color: '#1e40af', border: '1px solid color-mix(in srgb, #60a5fa 20%, var(--surface-primary))' },
  PQ:               { backgroundColor: 'color-mix(in srgb, #0ea5e9 12%, var(--surface-primary))', color: '#0369a1', border: '1px solid color-mix(in srgb, #0ea5e9 20%, var(--surface-primary))' },
  "BC NDP":         { backgroundColor: 'color-mix(in srgb, #f59e0b 12%, var(--surface-primary))', color: '#b45309', border: '1px solid color-mix(in srgb, #f59e0b 20%, var(--surface-primary))' },
  "BC United":      { backgroundColor: 'color-mix(in srgb, #3b82f6 12%, var(--surface-primary))', color: '#1d4ed8', border: '1px solid color-mix(in srgb, #3b82f6 20%, var(--surface-primary))' },
  UCP:              { backgroundColor: 'color-mix(in srgb, #2563eb 12%, var(--surface-primary))', color: '#1e3a8a', border: '1px solid color-mix(in srgb, #2563eb 20%, var(--surface-primary))' },
}

export const DEFAULT_PARTY_STYLE: CSSProperties = {
  backgroundColor: 'var(--surface-secondary)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-subtle)',
}
