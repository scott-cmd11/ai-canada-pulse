'use client'

import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || status === 'submitting') return

    setStatus('submitting')
    setMessage('')

    try {
      const res = await fetch('/api/v1/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'Check your email to confirm')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.message || 'Something went wrong')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="saas-card rounded-xl p-5"
        style={{ borderColor: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)' }}
      >
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: '8px',
          }}
        >
          Almost there
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
    )
  }

  return (
    <div className="saas-card rounded-xl p-5">
      <p
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
          marginBottom: '6px',
        }}
      >
        Weekly Briefing
      </p>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '14px',
        }}
      >
        Get the week&apos;s Canadian AI developments in your inbox every Monday.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          placeholder="you@example.com"
          required
          disabled={status === 'submitting'}
          className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none transition-colors"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: status === 'error' ? '#dc3545' : 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = status === 'error' ? '#dc3545' : 'var(--border-subtle)'
          }}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition-opacity"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            opacity: status === 'submitting' ? 0.6 : 1,
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>

      {status === 'error' && message && (
        <p style={{ fontSize: '12px', color: '#dc3545', marginTop: '6px' }}>{message}</p>
      )}

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
        Your email is used only for this newsletter and is never shared or sold. You can unsubscribe instantly from any email. See our{' '}
        <a href="/legal" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>privacy policy</a>.
      </p>
    </div>
  )
}
