"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CONTRACTS,
  DEFAULT_MILESTONES,
  type Contract,
  type ContractStatus,
  type Milestone,
  type MilestoneStatus
} from "@/data/programme";

const STORAGE_KEY = "ber-war-map-programme-v1";

export type ProgrammeState = {
  contracts: Contract[];
  milestones: Milestone[];
  focusDate: string;
};

const DEFAULT_FOCUS = "2026-09-01";

const DEFAULT_STATE: ProgrammeState = {
  contracts: DEFAULT_CONTRACTS,
  milestones: DEFAULT_MILESTONES,
  focusDate: DEFAULT_FOCUS
};

function loadState(): ProgrammeState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as ProgrammeState;
    return {
      contracts: parsed.contracts?.length ? parsed.contracts : DEFAULT_CONTRACTS,
      milestones: parsed.milestones?.length ? parsed.milestones : DEFAULT_MILESTONES,
      focusDate: parsed.focusDate ?? DEFAULT_FOCUS
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: ProgrammeState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useProgrammeStore() {
  const [state, setState] = useState<ProgrammeState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  const setFocusDate = useCallback((focusDate: string) => {
    setState((s) => ({ ...s, focusDate }));
  }, []);

  const updateContractStatus = useCallback((id: string, status: ContractStatus) => {
    setState((s) => ({
      ...s,
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, status } : c))
    }));
  }, []);

  const updateMilestoneStatus = useCallback((id: string, status: MilestoneStatus) => {
    setState((s) => ({
      ...s,
      milestones: s.milestones.map((m) => (m.id === id ? { ...m, status } : m))
    }));
  }, []);

  const resetProgramme = useCallback(() => {
    const fresh = {
      contracts: DEFAULT_CONTRACTS,
      milestones: DEFAULT_MILESTONES,
      focusDate: DEFAULT_FOCUS
    };
    setState(fresh);
    saveState(fresh);
  }, []);

  return {
    ...state,
    hydrated,
    setFocusDate,
    updateContractStatus,
    updateMilestoneStatus,
    resetProgramme
  };
}
