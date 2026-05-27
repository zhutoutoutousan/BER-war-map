/** BER+ programme — contracts, milestones, delivery phases (Pilot-1 → scale) */

export type PhaseId = "I" | "II" | "III";

export type ContractStatus =
  | "planned"
  | "draft"
  | "term-sheet"
  | "signed"
  | "active"
  | "expired"
  | "on-hold";

export type ContractType =
  | "mou"
  | "ppa"
  | "lease"
  | "epc"
  | "o-and-m"
  | "equity"
  | "permits"
  | "other";

export type Contract = {
  id: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  parties: string[];
  valueEur?: number;
  startDate?: string;
  endDate?: string;
  milestoneIds: string[];
  notes?: string;
};

export type MilestoneStatus = "upcoming" | "in-progress" | "done" | "at-risk" | "blocked";

export type Milestone = {
  id: string;
  title: string;
  phase: PhaseId;
  targetDate: string;
  status: MilestoneStatus;
  contractIds: string[];
  description?: string;
};

export type ProgrammePhase = {
  id: PhaseId;
  label: string;
  startDate: string;
  endDate: string;
  summary: string;
};

export const PROGRAMME_ORIGIN = "2026-04-01";
export const PROGRAMME_HORIZON = "2036-12-31";

export const PHASES: ProgrammePhase[] = [
  {
    id: "I",
    label: "Phase I — Validate",
    startDate: "2026-04-01",
    endDate: "2028-03-31",
    summary: "Build Pilot-1; financial close; validate tech, business, governance."
  },
  {
    id: "II",
    label: "Phase II — Scale",
    startDate: "2028-04-01",
    endDate: "2031-03-31",
    summary: "Replicate Pilot-N; corridor microgrid; EWF platform company."
  },
  {
    id: "III",
    label: "Phase III — Lead",
    startDate: "2031-04-01",
    endDate: "2036-12-31",
    summary: "BER+ coverage; license EWF module for export."
  }
];

export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: "ms-spv",
    title: "BER+ Infrastructure SPV formed",
    phase: "I",
    targetDate: "2026-06-30",
    status: "in-progress",
    contractIds: ["ctr-spv-mou"],
    description: "Legal entity + governance charter (counsel confirms)."
  },
  {
    id: "ms-pilot-close",
    title: "Pilot-1 financial close",
    phase: "I",
    targetDate: "2026-12-15",
    status: "upcoming",
    contractIds: ["ctr-segro-lease", "ctr-fbb-ppa", "ctr-pilot-epc"],
    description: "Equity + anchor off-take sufficient for FC."
  },
  {
    id: "ms-pilot-build",
    title: "Pilot-1 construction start",
    phase: "I",
    targetDate: "2027-03-01",
    status: "upcoming",
    contractIds: ["ctr-pilot-epc"],
    description: "SEGRO North Cargo Micro-Hub site mobilization."
  },
  {
    id: "ms-energize",
    title: "Pilot-1 energization & EWF demo",
    phase: "I",
    targetDate: "2027-11-30",
    status: "upcoming",
    contractIds: ["ctr-fbb-ppa", "ctr-om-framework"],
    description: "PV+BESS live; water+farm module commissioned."
  },
  {
    id: "ms-replicate",
    title: "Pilot-2 / Pilot-3 term sheets",
    phase: "II",
    targetDate: "2029-06-30",
    status: "upcoming",
    contractIds: ["ctr-om-framework"],
    description: "Replicate modules along corridor."
  },
  {
    id: "ms-microgrid",
    title: "NEOCITY corridor microgrid concept",
    phase: "II",
    targetDate: "2030-03-31",
    status: "upcoming",
    contractIds: [],
    description: "Utility spine + interconnect study."
  },
  {
    id: "ms-ewf-co",
    title: "EWF platform company launch",
    phase: "II",
    targetDate: "2030-12-31",
    status: "upcoming",
    contractIds: ["ctr-om-framework"],
    description: "Design + O&M fees replicating modules."
  },
  {
    id: "ms-license",
    title: "EWF module export license (MVP)",
    phase: "III",
    targetDate: "2033-06-30",
    status: "upcoming",
    contractIds: [],
    description: "License framework for other regions."
  }
];

export const DEFAULT_CONTRACTS: Contract[] = [
  {
    id: "ctr-spv-mou",
    title: "BER+ Infrastructure SPV — shareholder / MOU",
    type: "mou",
    status: "term-sheet",
    parties: ["BER+ members", "Infra fund (TBD)", "Counsel"],
    milestoneIds: ["ms-spv"],
    notes: "Equity & MOUs at term-sheet stage."
  },
  {
    id: "ctr-segro-lease",
    title: "SEGRO — land / roofs / tenant access",
    type: "lease",
    status: "term-sheet",
    parties: ["SEGRO", "BER+ Infrastructure SPV"],
    valueEur: 0,
    startDate: "2027-01-01",
    endDate: "2047-01-01",
    milestoneIds: ["ms-pilot-close", "ms-pilot-build"],
    notes: "Pilot-1 anchor site (~2.0 ha)."
  },
  {
    id: "ctr-fbb-ppa",
    title: "FBB / FEW — green PPA (anchor off-take)",
    type: "ppa",
    status: "term-sheet",
    parties: ["Flughafen Berlin Brandenburg", "BER+ Infrastructure SPV"],
    valueEur: 0,
    startDate: "2028-01-01",
    endDate: "2043-01-01",
    milestoneIds: ["ms-pilot-close", "ms-energize"],
    notes: "Stable revenue stream; RECs / carbon accounting."
  },
  {
    id: "ctr-pilot-epc",
    title: "Pilot-1 EPC — modular shell + PV/BESS",
    type: "epc",
    status: "draft",
    parties: ["GOLDBECK (lead opt.)", "BER+ Infrastructure SPV"],
    milestoneIds: ["ms-pilot-close", "ms-pilot-build"],
    notes: "Containerized BESS + rooftop PV 2 MWp."
  },
  {
    id: "ctr-om-framework",
    title: "Resilience Module O&M + replication framework",
    type: "o-and-m",
    status: "planned",
    parties: ["BER+ Infrastructure SPV", "Arcadis", "e.distherm"],
    milestoneIds: ["ms-energize", "ms-replicate", "ms-ewf-co"],
    notes: "Platform fees for design + O&M on Pilot-N."
  },
  {
    id: "ctr-wfg-mou",
    title: "WFG LDS — policy alignment & settlement support",
    type: "mou",
    status: "signed",
    parties: ["WFG Dahme-Spreewald", "BER+ e.V."],
    milestoneIds: [],
    notes: "Ansiedlung, permits, regional marketing."
  },
  {
    id: "ctr-grid-permit",
    title: "Microgrid / Netzanschluss — BNetzA pathway",
    type: "permits",
    status: "draft",
    parties: ["BER+ Infrastructure SPV", "BNetzA", "E.DIS"],
    milestoneIds: ["ms-pilot-close"],
    notes: "Parallel to module build; queue risk tracked."
  }
];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  planned: "Planned",
  draft: "Draft",
  "term-sheet": "Term sheet",
  signed: "Signed",
  active: "Active",
  expired: "Expired",
  "on-hold": "On hold"
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  mou: "MOU",
  ppa: "PPA",
  lease: "Lease",
  epc: "EPC",
  "o-and-m": "O&M",
  equity: "Equity",
  permits: "Permits",
  other: "Other"
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  upcoming: "Upcoming",
  "in-progress": "In progress",
  done: "Done",
  "at-risk": "At risk",
  blocked: "Blocked"
};

export function phaseForDate(iso: string): PhaseId {
  const t = new Date(iso).getTime();
  for (const p of PHASES) {
    if (t >= new Date(p.startDate).getTime() && t <= new Date(p.endDate).getTime()) return p.id;
  }
  if (t < new Date(PHASES[0].startDate).getTime()) return "I";
  return "III";
}

export function dateToProgress(iso: string): number {
  const start = new Date(PROGRAMME_ORIGIN).getTime();
  const end = new Date(PROGRAMME_HORIZON).getTime();
  const t = new Date(iso).getTime();
  return Math.max(0, Math.min(1, (t - start) / (end - start)));
}

export function progressToDate(progress: number): string {
  const start = new Date(PROGRAMME_ORIGIN).getTime();
  const end = new Date(PROGRAMME_HORIZON).getTime();
  const t = start + progress * (end - start);
  return new Date(t).toISOString().slice(0, 10);
}
