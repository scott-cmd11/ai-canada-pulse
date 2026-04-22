type Props = {
  category: string
  size?: number
  className?: string
}

// Maps any incoming category label to one of our six canonical glyphs.
function resolve(category: string): "policy" | "markets" | "research" | "funding" | "geopolitics" | "default" {
  const c = category.toLowerCase()
  if (c.includes("polic") || c.includes("regulat")) return "policy"
  if (c.includes("industr") || c.includes("startup") || c.includes("market")) return "markets"
  if (c.includes("research") || c.includes("development")) return "research"
  if (c.includes("fund") || c.includes("invest")) return "funding"
  if (c.includes("global") || c.includes("geopolit") || c.includes("race")) return "geopolitics"
  return "default"
}

export default function CategoryGlyph({ category, size = 40, className }: Props) {
  const kind = resolve(category)
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  }

  // Accent: maple red via CSS var — used on ONE element per glyph for a clear focal point.
  const accent = { stroke: "var(--accent-primary)" }

  switch (kind) {
    case "policy":
      // Parliamentary pediment: 3 columns under a pitched roof, ground line in accent.
      return (
        <svg {...common}>
          <path d="M6 14 L20 6 L34 14" />
          <path d="M10 14 V30" />
          <path d="M20 14 V30" />
          <path d="M30 14 V30" />
          <path d="M4 30 H36" {...accent} strokeWidth={2.5} />
        </svg>
      )
    case "markets":
      // Three bars with a rising trend line in accent.
      return (
        <svg {...common}>
          <path d="M8 30 V22" />
          <path d="M20 30 V16" />
          <path d="M32 30 V10" />
          <path d="M4 32 H36" />
          <path d="M6 24 L20 14 L32 6" {...accent} strokeWidth={2.5} />
          <circle cx="32" cy="6" r="1.8" fill="var(--accent-primary)" stroke="none" />
        </svg>
      )
    case "research":
      // Orbital atom: central nucleus + two elliptical orbits, accent on nucleus.
      return (
        <svg {...common}>
          <ellipse cx="20" cy="20" rx="14" ry="6" transform="rotate(30 20 20)" />
          <ellipse cx="20" cy="20" rx="14" ry="6" transform="rotate(-30 20 20)" />
          <circle cx="20" cy="20" r="3" fill="var(--accent-primary)" stroke="none" />
        </svg>
      )
    case "funding":
      // Stacked coins — three ellipses, top rim in accent.
      return (
        <svg {...common}>
          <ellipse cx="20" cy="28" rx="12" ry="4" />
          <path d="M8 22 V28" />
          <path d="M32 22 V28" />
          <ellipse cx="20" cy="22" rx="12" ry="4" />
          <path d="M8 16 V22" />
          <path d="M32 16 V22" />
          <ellipse cx="20" cy="16" rx="12" ry="4" {...accent} strokeWidth={2.5} />
        </svg>
      )
    case "geopolitics":
      // Compass rose: circle + cardinal points, north arm in accent.
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="14" />
          <path d="M20 8 L23 20 L20 32 L17 20 Z" fill="currentColor" stroke="none" />
          <path d="M20 8 L23 20 L20 20 Z" fill="var(--accent-primary)" stroke="none" />
          <path d="M8 20 H32" strokeWidth={1} opacity={0.5} />
        </svg>
      )
    default:
      // Signal: concentric dots, centre in accent.
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="14" />
          <circle cx="20" cy="20" r="8" />
          <circle cx="20" cy="20" r="3" fill="var(--accent-primary)" stroke="none" />
        </svg>
      )
  }
}
