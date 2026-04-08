'use client'

import { useState } from 'react'

interface Props {
  url: string
  title: string
}

export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false)

  const fullUrl = url.startsWith('http') ? url : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`

  // For social sharing, compose clean text with the URL inline.
  // This avoids ugly Google News redirect URLs being shown as separate URL parameters.
  const shareText = `${title}\n${fullUrl}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = fullUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    transition: 'border-color 0.15s ease, color 0.15s ease',
  } as const

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = 'var(--accent-primary)'
      e.currentTarget.style.color = 'var(--accent-primary)'
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = 'var(--border-subtle)'
      e.currentTarget.style.color = 'var(--text-muted)'
    },
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Copy Link */}
      <button
        onClick={copyLink}
        title={copied ? 'Copied!' : 'Copy link'}
        style={buttonStyle}
        {...hoverHandlers}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>

      {/* X/Twitter — use text param only so X shows clean title + URL */}
      <a
        href={`https://x.com/intent/post?text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on X"
        style={{ ...buttonStyle, textDecoration: 'none' }}
        {...hoverHandlers}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      {/* LinkedIn — feed compose with text pre-filled */}
      <a
        href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on LinkedIn"
        style={{ ...buttonStyle, textDecoration: 'none' }}
        {...hoverHandlers}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>

      {/* Bluesky */}
      <a
        href={`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on Bluesky"
        style={{ ...buttonStyle, textDecoration: 'none' }}
        {...hoverHandlers}
      >
        <svg width="14" height="14" viewBox="0 0 600 530" fill="currentColor">
          <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
        </svg>
      </a>
    </div>
  )
}
