/** Live demo walkthrough — show the platform: company → investor → municipality → final thought */

import type { MemberCategory } from "@/data/mitglieder";

export type TourTab =
  | "value"
  | "members"
  | "junqingchu"
  | "programme"
  | "briefing"
  | "inventory"
  | "foryou";

export type TourAction = {
  tab?: TourTab;
  viewMode?: "geo" | "matching";
  memberId?: string;
  filterCategory?: MemberCategory | "all";
  landSiteId?: string;
  openLeftPanel?: boolean;
};

export type TourAct = "intro" | "company" | "investor" | "municipality" | "evolution" | "finale";

export type DemoWalkthroughStep = {
  id: string;
  stepLabel: string;
  title: string;
  instruction: string;
  action: TourAction;
  spotlight?: string;
  act: TourAct;
  /** Inline Future Phase cards in the coach panel */
  showEvolution?: boolean;
};

export const GUIDED_TOUR_HEADLINE = "Show the platform";

export const GUIDED_TOUR_SUBTITLE =
  "Company · investor · municipality · how it evolves — the demo is your strongest argument.";

/** One tour for everyone — June 12 live demo structure */
export const DEMO_WALKTHROUGH: DemoWalkthroughStep[] = [
  {
    id: "intro",
    stepLabel: "Live demo",
    title: "Show the platform",
    instruction:
      "Don't explain every feature — watch the map move. Three stakeholder searches, one Board Room.",
    action: { viewMode: "geo", openLeftPanel: false },
    spotlight: "split-pane-ber",
    act: "intro"
  },

  /* ——— Company searching for a location ——— */
  {
    id: "act-company",
    stepLabel: "Walkthrough 1",
    title: "Company searching for a location",
    instruction: "A firm needs land near Schönefeld — browse parcels before anyone opens a PDF.",
    action: { tab: "junqingchu", viewMode: "geo", openLeftPanel: true },
    spotlight: "panel-osm-intel",
    act: "company"
  },
  {
    id: "co-site",
    stepLabel: "Company · land",
    title: "Fly to a candidate site",
    instruction: "Neue Mitte Schönefeld on the map — indicative OSM, enough to ask before a site visit.",
    action: { tab: "junqingchu", viewMode: "geo", landSiteId: "neue-mitte", openLeftPanel: true },
    spotlight: "split-pane-ber",
    act: "company"
  },
  {
    id: "co-developers",
    stepLabel: "Company · who",
    title: "Who develops nearby?",
    instruction: "Mitglieder · developers · BUWOG focused — see who sits on the same corridor segment.",
    action: {
      tab: "members",
      viewMode: "geo",
      filterCategory: "developer",
      memberId: "buwog",
      openLeftPanel: true
    },
    spotlight: "member-row-buwog",
    act: "company"
  },
  {
    id: "co-match",
    stepLabel: "Company · match",
    title: "Queue a corridor introduction",
    instruction: "Matching map · Save a strong link — location search without an inbox maze.",
    action: { viewMode: "matching", openLeftPanel: false },
    spotlight: "giant-matching-map",
    act: "company"
  },

  /* ——— Investor searching for opportunities ——— */
  {
    id: "act-investor",
    stepLabel: "Walkthrough 2",
    title: "Investor searching for opportunities",
    instruction: "Who is in the corridor? How many hectares? Is the region actually moving?",
    action: {
      tab: "members",
      viewMode: "geo",
      filterCategory: "investor",
      memberId: "sector-seven",
      openLeftPanel: true
    },
    spotlight: "member-row-sector-seven",
    act: "investor"
  },
  {
    id: "inv-ha",
    stepLabel: "Investor · surface",
    title: "Developable hectares",
    instruction: "Assets tab · land rollup — diligence starts on the map, not in a slide deck.",
    action: { tab: "junqingchu", viewMode: "geo", openLeftPanel: true },
    spotlight: "panel-osm-intel",
    act: "investor"
  },
  {
    id: "inv-pilot",
    stepLabel: "Investor · proof",
    title: "Pilot-1 proof site",
    instruction: "SEGRO Pilot-1 — 12–24 month anchor on the map, not a 2045 vision.",
    action: { tab: "junqingchu", viewMode: "geo", landSiteId: "pilot-1-segro", openLeftPanel: true },
    spotlight: "split-pane-ber",
    act: "investor"
  },
  {
    id: "inv-programme",
    stepLabel: "Investor · timeline",
    title: "Programme & contracts",
    instruction: "Programme tab · Phase I milestones · FC and energization dates investors can cite.",
    action: { tab: "programme", viewMode: "geo", openLeftPanel: true },
    spotlight: "panel-programme",
    act: "investor"
  },
  {
    id: "inv-match",
    stepLabel: "Investor · save",
    title: "Save an opportunity",
    instruction: "Matching map · Pass weak signals · Save what belongs in the diligence brief.",
    action: { viewMode: "matching", openLeftPanel: false },
    spotlight: "giant-matching-map",
    act: "investor"
  },

  /* ——— Municipality looking for partners ——— */
  {
    id: "act-municipality",
    stepLabel: "Walkthrough 3",
    title: "Municipality looking for partners",
    instruction: "County and WFG need evidence, partners, and captured asks — on one neutral surface.",
    action: { tab: "briefing", viewMode: "geo", openLeftPanel: true },
    spotlight: "panel-briefing",
    act: "municipality"
  },
  {
    id: "mun-partners",
    stepLabel: "Municipality · partners",
    title: "Public & economic dev partners",
    instruction: "Mitglieder · public filter · WFG Dahme-Spreewald on the map.",
    action: {
      tab: "members",
      viewMode: "geo",
      filterCategory: "public",
      memberId: "wfg-lds",
      openLeftPanel: true
    },
    spotlight: "member-row-wfg-lds",
    act: "municipality"
  },
  {
    id: "mun-map",
    stepLabel: "Municipality · corridor",
    title: "One corridor picture",
    instruction: "Full map · member zones and land anchors — regional strategy on one screen.",
    action: { viewMode: "geo", openLeftPanel: false },
    spotlight: "split-pane-ber",
    act: "municipality"
  },
  {
    id: "mun-programme",
    stepLabel: "Municipality · next steps",
    title: "Transparent milestones",
    instruction: "Programme · Pilot-1 validate window — dated steps for funding and county dialogue.",
    action: { tab: "programme", viewMode: "geo", openLeftPanel: true },
    spotlight: "panel-programme",
    act: "municipality"
  },
  {
    id: "mun-match",
    stepLabel: "Municipality · match",
    title: "Match companies to opportunities",
    instruction: "Matching map · capture corridor asks · assign follow-up instead of inbox drift.",
    action: { viewMode: "matching", openLeftPanel: false },
    spotlight: "giant-matching-map",
    act: "municipality"
  },

  /* ——— How the platform evolves ——— */
  {
    id: "evolution",
    stepLabel: "Future phase",
    title: "How would the platform evolve?",
    instruction:
      "This makes the idea realistic: Phase I is today's probe — each next step is fundable, tied to Programme milestones, not a technology miracle.",
    action: { tab: "value", viewMode: "geo", openLeftPanel: true },
    spotlight: "ber-plus-future-evolution",
    act: "evolution",
    showEvolution: true
  },

  /* ——— Final thought ——— */
  {
    id: "final",
    stepLabel: "Final thought",
    title: "The demo is your strongest argument",
    instruction:
      "Show the three searches on the map. Then show the evolution path — Pilot → Scale → Lead. Discussion beats defending features; ask what BER+ hosts next.",
    action: { viewMode: "geo", tab: "junqingchu", openLeftPanel: true },
    spotlight: "split-pane-ber",
    act: "finale"
  }
];

export function getWalkthroughSteps(): DemoWalkthroughStep[] {
  return DEMO_WALKTHROUGH;
}

export function walkthroughTitle(): string {
  return GUIDED_TOUR_HEADLINE;
}

export const TOUR_STORAGE_KEY = "ber-war-map-guided-tour-v4";
export const CAMEO_STORAGE_KEY = "ber-war-map-cameo-v1";

export function loadCameoComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CAMEO_STORAGE_KEY) === "done";
  } catch {
    return false;
  }
}

export function saveCameoComplete() {
  try {
    localStorage.setItem(CAMEO_STORAGE_KEY, "done");
  } catch {
    /* ignore */
  }
}

export function clearOnboardingProgress() {
  try {
    localStorage.removeItem(CAMEO_STORAGE_KEY);
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadTourComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "done";
  } catch {
    return false;
  }
}

export function saveTourComplete() {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "done");
  } catch {
    /* ignore */
  }
}

export const ACT_LABELS: Record<TourAct, string> = {
  intro: "Intro",
  company: "Company",
  investor: "Investor",
  municipality: "Municipality",
  evolution: "Evolve",
  finale: "Final"
};

export const ACT_COLORS: Record<TourAct, string> = {
  intro: "text-sky-300/90",
  company: "text-emerald-300/90",
  investor: "text-violet-300/90",
  municipality: "text-amber-300/90",
  evolution: "text-sky-200/95",
  finale: "text-emerald-200/95"
};
