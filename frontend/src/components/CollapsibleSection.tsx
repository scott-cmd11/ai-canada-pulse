'use client'

import { useState } from 'react'

interface Props {
  title: string
  children: React.ReactNode
}

export default function CollapsibleSection({ title, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)

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
        <span>{title}</span>
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
