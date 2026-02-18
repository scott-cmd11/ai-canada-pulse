"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { Mode } from "../lib/types";

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextType | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("policy");
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
