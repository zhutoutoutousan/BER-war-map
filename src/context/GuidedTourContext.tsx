"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TourAction } from "@/data/guided-tour";

type GuidedTourContextValue = {
  applyTourAction: (action: TourAction) => void;
};

const GuidedTourContext = createContext<GuidedTourContextValue | null>(null);

export function GuidedTourProvider({
  children,
  applyTourAction
}: {
  children: ReactNode;
  applyTourAction: (action: TourAction) => void;
}) {
  return (
    <GuidedTourContext.Provider value={{ applyTourAction }}>{children}</GuidedTourContext.Provider>
  );
}

export function useGuidedTourActions() {
  const ctx = useContext(GuidedTourContext);
  if (!ctx) throw new Error("useGuidedTourActions must be used within GuidedTourProvider");
  return ctx;
}
