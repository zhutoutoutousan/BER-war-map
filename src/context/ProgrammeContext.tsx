"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useProgrammeStore } from "@/lib/programme-store";

type ProgrammeContextValue = ReturnType<typeof useProgrammeStore>;

const ProgrammeContext = createContext<ProgrammeContextValue | null>(null);

export function ProgrammeProvider({ children }: { children: ReactNode }) {
  const store = useProgrammeStore();
  return <ProgrammeContext.Provider value={store}>{children}</ProgrammeContext.Provider>;
}

export function useProgramme() {
  const ctx = useContext(ProgrammeContext);
  if (!ctx) throw new Error("useProgramme must be used within ProgrammeProvider");
  return ctx;
}
