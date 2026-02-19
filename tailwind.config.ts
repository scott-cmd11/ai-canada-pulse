import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        bgSubtle: "var(--bg-subtle)",
        surface: "var(--surface)",
        surfaceRaised: "var(--surface-raised)",
        surfaceInset: "var(--surface-inset)",
        text: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        borderStrong: "var(--border-strong)",
        borderSoft: "var(--border-soft)",
        borderGlow: "var(--border-glow)",
        primary: "var(--primary-action)",
        primaryHover: "var(--primary-hover)",
        primarySubtle: "var(--primary-subtle)",
        onPrimary: "var(--on-primary)",
        statusPositive: "var(--status-positive)",
        statusNegative: "var(--status-negative)",
        statusWarning: "var(--status-warning)",
      },
      fontSize: {
        display: [
          "2rem",
          { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "700" },
        ],
        heading: [
          "1.25rem",
          { lineHeight: "1.3", letterSpacing: "-0.015em", fontWeight: "600" },
        ],
        subheading: [
          "0.9375rem",
          { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        body: ["0.875rem", { lineHeight: "1.6" }],
        caption: ["0.8125rem", { lineHeight: "1.5" }],
        micro: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        overline: [
          "0.6875rem",
          { lineHeight: "1", letterSpacing: "0.06em", fontWeight: "500" },
        ],
      },
      borderRadius: {
        DEFAULT: "6px",
        lg: "6px",
        xl: "6px",
        "2xl": "6px",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [],
};

export default config;
