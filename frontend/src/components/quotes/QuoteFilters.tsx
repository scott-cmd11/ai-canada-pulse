"use client"

import type { CSSProperties } from "react"

export interface QuoteFilterState {
  party: string
  chamber: string
  jurisdiction: string
  year: string
  q: string
}

export const DEFAULT_FILTERS: QuoteFilterState = {
  party: "All",
  chamber: "All",
  jurisdiction: "All",
  year: "All",
  q: "",
}

const PARTIES = ["All", "Liberal", "Conservative", "NDP", "Bloc Québécois", "Green", "CAQ", "UCP", "BC NDP"]
const CHAMBERS: Array<{ value: string; label: string }> = [
  { value: "All", label: "All chambers" },
  { value: "house", label: "House of Commons" },
  { value: "senate", label: "Senate" },
  { value: "provincial_legislature", label: "Provincial" },
  { value: "executive", label: "Executive" },
]
const JURISDICTIONS: Array<{ value: string; label: string }> = [
  { value: "All", label: "All jurisdictions" },
  { value: "federal", label: "Federal" },
  { value: "on", label: "Ontario" },
  { value: "qc", label: "Québec" },
  { value: "bc", label: "British Columbia" },
  { value: "ab", label: "Alberta" },
]

function selectStyle(isDefault: boolean): CSSProperties {
  return {
    borderColor: isDefault ? "var(--border-subtle)" : "color-mix(in srgb, var(--accent-primary) 20%, transparent)",
    backgroundColor: isDefault ? "var(--surface-primary)" : "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
    color: isDefault ? "var(--text-muted)" : "var(--accent-primary)",
  }
}

export default function QuoteFilters({
  filters,
  years,
  onChange,
  onReset,
}: {
  filters: QuoteFilterState
  years: number[]
  onChange: (next: QuoteFilterState) => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {PARTIES.map((party) => {
          const isActive = filters.party === party
          return (
            <button
              key={party}
              type="button"
              onClick={() => onChange({ ...filters, party })}
              aria-pressed={isActive}
              className="min-h-[36px] rounded-full border px-3 py-2 text-xs font-semibold transition-colors"
              style={isActive
                ? {
                    borderColor: "color-mix(in srgb, var(--accent-primary) 20%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
                    color: "var(--accent-primary)",
                  }
                : {
                    borderColor: "var(--border-subtle)",
                    backgroundColor: "var(--surface-primary)",
                    color: "var(--text-muted)",
                  }
              }
            >
              {party === "All" ? "All parties" : party}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.jurisdiction}
          onChange={(e) => onChange({ ...filters, jurisdiction: e.target.value })}
          className="min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors"
          style={selectStyle(filters.jurisdiction === "All")}
          aria-label="Filter by jurisdiction"
        >
          {JURISDICTIONS.map((j) => (
            <option key={j.value} value={j.value}>{j.label}</option>
          ))}
        </select>

        <select
          value={filters.chamber}
          onChange={(e) => onChange({ ...filters, chamber: e.target.value })}
          className="min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors"
          style={selectStyle(filters.chamber === "All")}
          aria-label="Filter by chamber"
        >
          {CHAMBERS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          value={filters.year}
          onChange={(e) => onChange({ ...filters, year: e.target.value })}
          className="min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors"
          style={selectStyle(filters.year === "All")}
          aria-label="Filter by year"
        >
          <option value="All">All years</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>

        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search text or speaker…"
          className="min-h-[36px] rounded-full border px-3 text-xs font-medium flex-1 min-w-[160px]"
          style={{
            borderColor: filters.q ? "color-mix(in srgb, var(--accent-primary) 20%, transparent)" : "var(--border-subtle)",
            backgroundColor: "var(--surface-primary)",
            color: "var(--text-primary)",
          }}
          aria-label="Search quotes"
        />

        {(filters.party !== "All" || filters.chamber !== "All" || filters.jurisdiction !== "All" || filters.year !== "All" || filters.q) && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-primary)", color: "var(--text-muted)" }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
