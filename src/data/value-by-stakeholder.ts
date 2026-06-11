import type { GuestPersona } from "@/lib/guest-personas";

export type ValueOutcome =
  | "faster_matching"
  | "visibility"
  | "inquiries"
  | "collaboration"
  | "regional_identity";

export const VALUE_OUTCOME_LABELS: Record<ValueOutcome, string> = {
  faster_matching: "Faster matching",
  visibility: "Increased visibility",
  inquiries: "More qualified inquiries",
  collaboration: "Improved collaboration",
  regional_identity: "Stronger regional identity"
};

export type StakeholderValue = {
  id: string;
  label: string;
  persona?: GuestPersona;
  memberCategories?: string[];
  headline: string;
  benefits: string[];
  /** Honest probe targets — not audited KPIs */
  metrics: { label: string; value: string }[];
  primaryOutcomes: ValueOutcome[];
};

export const GENIUS_IDEA = {
  title: "Corridor Inquiry Ledger",
  titleDe: "Korridor-Anfrage-Register",
  pitch:
    "BER+ hosts a neutral register — not a broker. Every inbound request (plot search, investor screen, grid question, member intro) gets an ID, a map anchor, a match confidence, and a tracked outcome.",
  whyGenius:
    "Today demand disappears into inboxes. A ledger makes corridor interest visible and countable — without any member surrendering CRM ownership.",
  workflow: [
    "Request arrives (company, investor, municipality, partner)",
    "BER+ logs it on the map with linked assets + members",
    "Matching / Pass · Save queue produces a shortlist",
    "Co-inventory verification raises confidence before intro",
    "Quarterly board sees: inquiries captured · intros made · deals advanced"
  ],
  probeTargets: [
    { label: "Time to first map-backed shortlist", value: "Days, not 3–6 weeks of email" },
    { label: "Inquiries captured per quarter", value: "Target: all corridor asks logged — zero lost in inboxes" },
    { label: "Intro conversion", value: "Pass/Save → member intro → track in ledger" },
    { label: "Board reporting", value: "One slide: demand · supply · gaps" }
  ]
} as const;

/** Corridor-scale anchors for honest quantification in demos */
export const CORRIDOR_VALUE_ANCHORS = {
  mitglieder: 14,
  landAnchors: 7,
  developableHaNote: "OSM-indicative rollup on Assets tab",
  matchingGraphNote: "Member ↔ land ↔ infra links on Matching map",
  coInventoryNote: "Verified rows replace indicative links over time"
} as const;

export const STAKEHOLDER_VALUES: StakeholderValue[] = [
  {
    id: "investors",
    label: "Investors",
    persona: "investor",
    headline: "Verifiable corridor thesis — not name-only decks",
    benefits: [
      "Developable ha + logistics narrative on one map",
      "Pilot-1 and programme phase visible before site visits",
      "Pass/Save queue filters weak signals from map-backed matches"
    ],
    metrics: [
      { label: "Due diligence prep", value: "1 map session vs 5+ fragmented sources" },
      { label: "Opportunity screen", value: "Names + map evidence, not press clips alone" },
      { label: "Ledger effect", value: "Track which corridor themes attract capital" }
    ],
    primaryOutcomes: ["faster_matching", "visibility", "inquiries"]
  },
  {
    id: "companies",
    label: "Companies seeking locations",
    persona: "company",
    headline: "Find land near cargo, grid, and logistics — faster",
    benefits: [
      "Browse indicative gewerbe parcels + BER+ land anchors together",
      "See which Mitglieder sit near your requirements",
      "Submit a plot search into the Inquiry Ledger — get a shortlist, not a PDF maze"
    ],
    metrics: [
      { label: "Site search", value: "4 siloed sources → 1 corridor view" },
      { label: "Coordination tax", value: "3 meetings before reality-check → map-first filter" },
      { label: "Time saved (probe)", value: "Weeks of email → days to first credible options" }
    ],
    primaryOutcomes: ["faster_matching", "visibility", "inquiries"]
  },
  {
    id: "municipalities",
    label: "Municipalities & public partners",
    persona: "municipality",
    headline: "One briefing surface for board and Länder dialogue",
    benefits: [
      "Stitch airport, developer, utility, and member updates into one map story",
      "Evidence packs for funding and ÖPNV/grid advocacy",
      "Ledger shows what the region is actually being asked for"
    ],
    metrics: [
      { label: "Board prep", value: "4 silos → 1 slide-ready corridor snapshot" },
      { label: "Transparency", value: "Programme timeline + Pilot-1 on same map as land" },
      { label: "Regional narrative", value: "Shared Flughafenregion front door for investors" }
    ],
    primaryOutcomes: ["collaboration", "regional_identity", "visibility"]
  },
  {
    id: "developers",
    label: "Developers",
    memberCategories: ["developer"],
    headline: "Market plots and partners with corridor context",
    benefits: [
      "Land anchors linked to your Mitglied profile",
      "Matching map surfaces co-development and logistics adjacency",
      "Asset mgmt demo: publish availability when ready — stay member-owned"
    ],
    metrics: [
      { label: "Plot visibility", value: "Implicit availability → explorable corridor slice" },
      { label: "Partner discovery", value: "Proximity matches vs manual intros" },
      { label: "Pilot-1 halo", value: "Anchor narrative for north belt / SEGRO cluster" }
    ],
    primaryOutcomes: ["inquiries", "visibility", "faster_matching"]
  },
  {
    id: "members",
    label: "BER+ members",
    persona: "explore",
    headline: "Membership value beyond your own dossier",
    benefits: [
      "Your sites visible in corridor context — not isolated PDFs",
      "Receive qualified inquiries via ledger, not random email",
      "Co-inventory: you verify what BER+ may show — you keep ownership"
    ],
    metrics: [
      { label: "Discovery", value: "Peers browse what is in play nearby" },
      { label: "Inquiry quality", value: "Map-backed asks vs vague “any land near BER?”" },
      { label: "Retention", value: "Tangible coordination tool, not generic association fee" }
    ],
    primaryOutcomes: ["collaboration", "inquiries", "visibility"]
  },
  {
    id: "innovation_partners",
    label: "Innovation & infra partners",
    memberCategories: ["infrastructure", "consulting"],
    headline: "Place pilots where grid, heat, and logistics align",
    benefits: [
      "Infrastructure OSM layers + member-linked industry polygons",
      "Pilot-1 Module 1.0 story for replication pitches",
      "Ledger captures grid-timing and resilience asks in one queue"
    ],
    metrics: [
      { label: "Pilot placement", value: "Locate stall points on map — not slide guesses" },
      { label: "Ecosystem fit", value: "Match infra offer to mapped gewerbe load" },
      { label: "Advocacy", value: "Briefing tab evidence for BNetzA / FEW dialogue" }
    ],
    primaryOutcomes: ["collaboration", "faster_matching", "visibility"]
  }
];

export function stakeholderForPersona(persona: GuestPersona | null | undefined): StakeholderValue | null {
  if (!persona) return null;
  return STAKEHOLDER_VALUES.find((s) => s.persona === persona) ?? null;
}

export function aggregateOutcomeScores(): { outcome: ValueOutcome; score: number; label: string }[] {
  const counts: Record<ValueOutcome, number> = {
    faster_matching: 0,
    visibility: 0,
    inquiries: 0,
    collaboration: 0,
    regional_identity: 0
  };
  for (const s of STAKEHOLDER_VALUES) {
    for (const o of s.primaryOutcomes) counts[o] += 1;
  }
  return (Object.keys(counts) as ValueOutcome[]).map((outcome) => ({
    outcome,
    score: counts[outcome],
    label: VALUE_OUTCOME_LABELS[outcome]
  }));
}
