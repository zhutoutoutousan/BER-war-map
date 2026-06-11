import type { LeftTab } from "@/components/BerPlusValuePanel";
import type { MemberCategory } from "@/data/mitglieder";
import { BRAND } from "@/lib/brand";

export type GuestPersona = "company" | "investor" | "municipality" | "explore";

export type PersonaConfig = {
  label: string;
  shortLabel: string;
  subtitle: string;
  filterCategory: MemberCategory | "all";
  defaultTab: LeftTab;
  /** Tabs highlighted as recommended for this persona */
  highlightTabs: LeftTab[];
  demoMemberId?: string;
  categoryHint?: MemberCategory;
  accent: {
    border: string;
    bg: string;
    badge: string;
    text: string;
    chip: string;
  };
};

export const GUEST_PERSONAS: Record<GuestPersona, PersonaConfig> = {
  company: {
    label: "Company seeking a location",
    shortLabel: "Company",
    subtitle: "Land parcels, corridor layers, member focus",
    filterCategory: "developer",
    defaultTab: "junqingchu",
    highlightTabs: ["junqingchu", "members", "value"],
    demoMemberId: "buwog",
    categoryHint: "developer",
    accent: {
      border: "border-emerald-400/50",
      bg: "from-emerald-950/70 to-ink-950/90",
      badge: "bg-emerald-400/25 text-emerald-100",
      text: "text-emerald-100",
      chip: "bg-emerald-500/20 text-emerald-100 ring-emerald-400/40"
    }
  },
  investor: {
    label: "Investor seeking opportunities",
    shortLabel: "Investor",
    subtitle: "Mitglieder density, Pilot-1, developable ha",
    filterCategory: "investor",
    defaultTab: "members",
    highlightTabs: ["members", "junqingchu", "value"],
    demoMemberId: "sector-seven",
    categoryHint: "investor",
    accent: {
      border: "border-violet-400/55",
      bg: "from-violet-950/70 to-ink-950/90",
      badge: "bg-violet-400/25 text-violet-100",
      text: "text-violet-100",
      chip: "bg-violet-500/20 text-violet-100 ring-violet-400/40"
    }
  },
  municipality: {
    label: "Municipality & partners",
    shortLabel: "Municipality",
    subtitle: "Regional momentum, WFG-style paths, briefing evidence",
    filterCategory: "public",
    defaultTab: "briefing",
    highlightTabs: ["briefing", "members", "programme"],
    demoMemberId: "wfg-lds",
    categoryHint: "public",
    accent: {
      border: "border-amber-400/50",
      bg: "from-amber-950/70 to-ink-950/90",
      badge: "bg-amber-400/25 text-amber-100",
      text: "text-amber-100",
      chip: "bg-amber-500/20 text-amber-100 ring-amber-400/40"
    }
  },
  explore: {
    label: "Explore the full corridor",
    shortLabel: "Explore",
    subtitle: "All Mitglieder, coordination themes, matching map",
    filterCategory: "all",
    defaultTab: "value",
    highlightTabs: ["value", "members", "junqingchu"],
    accent: {
      border: "border-sky-400/45",
      bg: "from-sky-950/60 to-ink-950/90",
      badge: "bg-sky-400/25 text-sky-100",
      text: "text-sky-100",
      chip: "bg-sky-500/20 text-sky-100 ring-sky-400/40"
    }
  }
};

export const PROBLEM_SOLUTION_PAIRS = [
  { problem: "Information fragmented", solution: `${BRAND.name} — one briefing surface` },
  { problem: "Land hard to discover", solution: "OSM Intel + curated land anchors" },
  { problem: "Members see partial picture", solution: "Mitglieder graph + member focus" },
  { problem: "Requests poorly matched", solution: "Scored links + match review" },
  { problem: "Opportunities invisible", solution: "Matching map · Pass / Save queue" }
] as const;

export function personaPanelTitle(persona: GuestPersona | null, tab: LeftTab, tabTitles: Record<LeftTab, string>): string {
  if (!persona) return tabTitles[tab];
  const short = GUEST_PERSONAS[persona].shortLabel;
  return `${tabTitles[tab]} · ${short}`;
}
