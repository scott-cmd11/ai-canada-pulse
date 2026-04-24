"use client"

import { useCallback, useEffect, useState } from "react"
import type { Quote } from "@/lib/quotes/types"
import { PARTY_STYLES, DEFAULT_PARTY_STYLE } from "@/lib/party-styles"

interface PendingResponse {
  pending: Quote[]
  recentReviewed: Quote[]
}

export default function ReviewQueue({ adminKey }: { adminKey: string }) {
  const [pending, setPending] = useState<Quote[]>([])
  const [recent, setRecent] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, Partial<Quote>>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/quotes/pending?key=${encodeURIComponent(adminKey)}`, {
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`pending fetch failed: ${res.status}`)
      const json = (await res.json()) as PendingResponse
      setPending(Array.isArray(json.pending) ? json.pending : [])
      setRecent(Array.isArray(json.recentReviewed) ? json.recentReviewed : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed")
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    load()
  }, [load])

  const patchEdit = (id: string, patch: Partial<Quote>) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const saveEdit = async (id: string) => {
    const patch = edits[id]
    if (!patch || Object.keys(patch).length === 0) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/v1/quotes/${id}?key=${encodeURIComponent(adminKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error(`save failed: ${res.status}`)
      setEdits((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : "save failed")
    } finally {
      setBusyId(null)
    }
  }

  const approve = async (id: string) => {
    if (edits[id]) await saveEdit(id)
    setBusyId(id)
    try {
      const res = await fetch(`/api/v1/quotes/${id}/approve?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
      })
      if (!res.ok) throw new Error(`approve failed: ${res.status}`)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : "approve failed")
    } finally {
      setBusyId(null)
    }
  }

  const reject = async (id: string) => {
    const notes = window.prompt("Rejection notes (optional):") ?? ""
    setBusyId(id)
    try {
      const res = await fetch(`/api/v1/quotes/${id}/reject?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error(`reject failed: ${res.status}`)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : "reject failed")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        Loading review queue…
      </p>
    )
  }

  if (error) {
    return (
      <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>
        Error: {error}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Pending · {pending.length}
          </h2>
          <button
            type="button"
            onClick={() => load()}
            className="text-xs font-bold uppercase tracking-wider hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            Refresh
          </button>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Queue is clear. Nothing to review.
          </p>
        ) : (
          pending.map((q) => {
            const merged = { ...q, ...(edits[q.id] ?? {}) }
            const partyStyle = PARTY_STYLES[merged.party ?? ""] ?? DEFAULT_PARTY_STYLE
            const isDirty = Boolean(edits[q.id])
            const isBusy = busyId === q.id
            return (
              <article
                key={q.id}
                className="saas-card p-5 flex flex-col gap-3"
                style={{ backgroundColor: "var(--surface-primary)" }}
              >
                <div className="flex items-center flex-wrap gap-2">
                  <span
                    className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded"
                    style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)" }}
                  >
                    {q.source_type}
                  </span>
                  {merged.party && (
                    <span
                      className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded"
                      style={partyStyle}
                    >
                      {merged.party}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {q.jurisdiction} · {q.chamber ?? "—"} · {q.quote_date ?? "—"}
                  </span>
                  {q.source_url && (
                    <a
                      href={q.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold uppercase tracking-wider hover:underline ml-auto"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      Source &rarr;
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <LabeledInput
                    label="Speaker"
                    value={merged.speaker_name}
                    onChange={(v) => patchEdit(q.id, { speaker_name: v })}
                  />
                  <LabeledInput
                    label="Role"
                    value={merged.speaker_role ?? ""}
                    onChange={(v) => patchEdit(q.id, { speaker_role: v })}
                  />
                  <LabeledInput
                    label="Party"
                    value={merged.party ?? ""}
                    onChange={(v) => patchEdit(q.id, { party: v || null })}
                  />
                  <LabeledInput
                    label="Date"
                    value={merged.quote_date ?? ""}
                    onChange={(v) => patchEdit(q.id, { quote_date: v || null })}
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                <LabeledTextarea
                  label="Quote"
                  value={merged.quote_text}
                  onChange={(v) => patchEdit(q.id, { quote_text: v })}
                  rows={4}
                />
                <LabeledTextarea
                  label="Context"
                  value={merged.context_excerpt ?? ""}
                  onChange={(v) => patchEdit(q.id, { context_excerpt: v || null })}
                  rows={2}
                />
                <LabeledInput
                  label="Topics (comma-separated)"
                  value={(merged.topics ?? []).join(", ")}
                  onChange={(v) =>
                    patchEdit(q.id, {
                      topics: v
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <LabeledTextarea
                  label="Editor notes (internal)"
                  value={merged.editor_notes ?? ""}
                  onChange={(v) => patchEdit(q.id, { editor_notes: v || null })}
                  rows={2}
                />

                <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  {isDirty && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => saveEdit(q.id)}
                      className="min-h-[36px] rounded-full border px-3 text-xs font-semibold"
                      style={{
                        borderColor: "var(--border-subtle)",
                        backgroundColor: "var(--surface-secondary)",
                        color: "var(--text-primary)",
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      Save edits
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => approve(q.id)}
                    className="min-h-[36px] rounded-full border px-4 text-xs font-bold uppercase tracking-wider"
                    style={{
                      borderColor: "color-mix(in srgb, var(--accent-primary) 30%, transparent)",
                      backgroundColor: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
                      color: "var(--accent-primary)",
                      opacity: isBusy ? 0.6 : 1,
                    }}
                  >
                    {isDirty ? "Save & approve" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => reject(q.id)}
                    className="min-h-[36px] rounded-full border px-4 text-xs font-bold uppercase tracking-wider"
                    style={{
                      borderColor: "var(--border-subtle)",
                      backgroundColor: "var(--surface-primary)",
                      color: "var(--text-muted)",
                      opacity: isBusy ? 0.6 : 1,
                    }}
                  >
                    Reject
                  </button>
                </div>
              </article>
            )
          })
        )}
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Recently reviewed
          </h2>
          <ul className="flex flex-col gap-2">
            {recent.map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-baseline gap-2 text-xs p-3 rounded"
                style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)" }}
              >
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {q.status === "approved" ? "✓" : "✗"} {q.speaker_name}
                </span>
                <span>{q.quote_date ?? ""}</span>
                <span className="truncate flex-1 min-w-[200px]" style={{ color: "var(--text-muted)" }}>
                  &ldquo;{q.quote_text.slice(0, 140)}{q.quote_text.length > 140 ? "…" : ""}&rdquo;
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[34px] rounded border px-2 text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          backgroundColor: "var(--bg-page)",
          color: "var(--text-primary)",
        }}
      />
    </label>
  )
}

function LabeledTextarea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border px-2 py-1 text-sm leading-snug"
        style={{
          borderColor: "var(--border-subtle)",
          backgroundColor: "var(--bg-page)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-ui)",
        }}
      />
    </label>
  )
}
