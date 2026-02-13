import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        text: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        borderStrong: "var(--border-strong)",
        borderSoft: "var(--border-soft)",
        primary: "var(--primary-action)",
        onPrimary: "var(--on-primary)",
      },
    },
  },
  plugins: [],
};

export default config;
