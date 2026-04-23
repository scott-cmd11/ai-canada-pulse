'use client'

import { useState } from 'react'

interface Props {
  title: string
  children: React.ReactNode
  /** Open the section on first render. Useful for the most-active topic. */
  defaultOpen?: boolean
  /** One-line preview shown next to the title when the section is closed. */
  preview?: string
}

export default function CollapsibleSection({ title, children, defaultOpen = false, preview }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '0',
      }}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-primary)',
          fontSize: '14px',
          fontWeight: 600,
        }}
        aria-expanded={isOpen}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
          <span>{title}</span>
          {!isOpen && preview && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 400,
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {preview}
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: '18px',
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s ease',
            lineHeight: 1,
          }}
        >
          ›
        </span>
      </button>
      {isOpen && (
        <div style={{ paddingBottom: '16px' }}>
          {children}
        </div>
      )}
    </div>
  )
}
