/**
 * BER+ coordination framing — June 12 final presentation (IDI S26).
 * Strategic probes: options BER+ could continue after the course (12–24 months).
 */

import type { MemberCategory } from "@/data/mitglieder";

export type CoordinationTheme = {
  id: string;
  title: string;
  memberPain: string;
  berPlusWhy: string;
  platformAnswer: string;
  firstStep: string;
};

export const COORDINATION_THEMES: CoordinationTheme[] = [
  {
    id: "matching",
    title: "Matching companies & opportunities",
    memberPain: "Hard to see who sits near which asset, site, or corridor opportunity.",
    berPlusWhy: "BER+’s core role is connecting members to land, energy, and development context.",
    platformAnswer:
      "Mitglieder map + member-linked OSM highlights show proximity matches (name, land anchor, corridor zone).",
    firstStep: "Pilot curated member–asset links for 3–5 anchor members; validate in member workshops."
  },
  {
    id: "visibility",
    title: "Visibility of assets & spaces",
    memberPain: "Industrial land, grid, and logistics assets are invisible across spreadsheets and PDFs.",
    berPlusWhy: "Regional attractiveness depends on investors seeing developable ha and infrastructure in one view.",
    platformAnswer:
      "OSM Intel layers (land parcels, industry, power, transport) with BER+ land anchors and area (ha) scoring.",
    firstStep: "Publish corridor OSM snapshot quarterly; tie to BER+ land dossier (not cadastral — indicative)."
  },
  {
    id: "member-value",
    title: "More value for members",
    memberPain: "Membership feels generic — little tailored intelligence on “my” corridor footprint.",
    berPlusWhy: "Retention and advocacy grow when members see their linked sites and programme milestones.",
    platformAnswer:
      "Per-member profile: linked OSM features, land anchors, corridor role, and “your next step” on the map.",
    firstStep: "Onboard 10 members with verified OSM links + one land or infra target each."
  },
  {
    id: "coordination",
    title: "Stakeholder coordination",
    memberPain: "Airport, developers, utilities, and public agencies work in silos; timing is opaque.",
    berPlusWhy: "BER+ can host a neutral Board Room: programme phase, Pilot-1, corridor spine, live intel.",
    platformAnswer:
      "Programme timeline + Pilot-1 + intelligence feed + shared map — one briefing surface for leadership.",
    firstStep: "Use the Board Room in quarterly BER+ board briefings; capture “decisions needed” per phase."
  }
];

export const STRATEGIC_PROBE = {
  headline: "Strategic coordination probe — not a finished product",
  purpose:
    "Explore options BER+ could realistically continue after IDI: intelligence, matching, and visibility for the Flughafenregion.",
  whyNow: [
    "Grid congestion and stalled gewerbe expansion are acute today (BNetzA queues, FBB energy targets).",
    "Schönefeld Nord / SEGRO Pilot-1 creates a concrete 12–24 month anchor — not a 2045 vision.",
    "Members asked for better asset visibility and matching — BER+ leadership confirmed this in April 2026."
  ],
  whyBerPlus: [
    "Neutral association layer between airport, Länder, developers, and utilities.",
    "Existing Mitglieder network + land dossier + corridor narrative (Pilot-1 → Module 1.0).",
    "No single member owns the whole map — BER+ can host it."
  ],
  whyRegion: [
    "BER+ corridor is a defined geography (Schönefeld / Dahme-Spreewald / airport hinterland).",
    "OSM + open CCTV + RSS intel are low-cost evidence layers members already understand.",
    "Attractiveness for investment = visible ha + infra + coordinated milestones."
  ],
  berPlusCouldDo: [
    { label: "Pilot", detail: "SEGRO Pilot-1 — 2 ha proof unit (map anchor + programme Phase I)" },
    { label: "Platform", detail: "Board Room map as shared briefing surface (this prototype)" },
    { label: "Matching", detail: "Member ↔ OSM ↔ land anchor links (keyword + proximity rules)" },
    { label: "Intelligence", detail: "Corridor RSS / YouTube feed + OSM infrastructure dossier" },
    { label: "Advocacy", detail: "Evidence packs for Länder / grid / ÖPNV dialogue (briefing tab)" }
  ],
  horizon: "12–24 months: indicative OSM, member links, quarterly intel — not cadastral GIS replacement."
};

/** Pilot Phase — demystify the probe: what the demo is vs what BER+ e.V. must deliver */
export type PilotDeliverableCategory =
  | "governance"
  | "members"
  | "data"
  | "coordination"
  | "legal"
  | "physical";

export type PilotDeliverable = {
  id: string;
  category: PilotDeliverableCategory;
  title: string;
  detail: string;
  owner: string;
  when: string;
  milestoneId?: string;
  contractId?: string;
};

export const PILOT_DELIVERABLE_CATEGORY_LABELS: Record<PilotDeliverableCategory, string> = {
  governance: "Governance",
  members: "Member onboarding",
  data: "Data stewardship",
  coordination: "Coordination ops",
  legal: "Legal & contracts",
  physical: "Pilot-1 delivery"
};

export const BER_PLUS_PILOT_PHASE = {
  headline: "What must BER+ actually do?",
  subhead: "Pilot Phase · Phase I — Validate (Apr 2026 – Mar 2028)",
  phaseGoal:
    "Prove corridor coordination works and Pilot-1 reaches financial close — without pretending this map is cadastre, CRM, or a finished product.",
  antiMagic: {
    title: "This Board Room is a probe — not magic",
    intro:
      "The demo feels polished because it is curated for June 12. Real value only arrives when BER+ runs the association work behind each layer.",
    demoShows: [
      "Indicative OSM polygons + BER+ land anchors on one corridor map",
      "Keyword / proximity member↔asset links and illustrative match scores",
      "Co-inventory workflow stored in your browser — not a production registry",
      "Programme timeline with term-sheet-stage contracts (SPV, SEGRO, FBB PPA)"
    ],
    berPlusDelivers: [
      "Board mandate + pilot charter: what BER+ hosts vs what members retain",
      "3–5 anchor Mitglieder onboarded with named inventory leads and visibility rules",
      "Quarterly OSM refresh + verified inventory rows (indicative → submitted → verified)",
      "Facilitated Board Room briefings, Inquiry Ledger ops, and match follow-through",
      "Legal path to Pilot-1 FC: SPV MOU, SEGRO lease, FBB green PPA, EPC term sheet"
    ]
  },
  associationDeliverables: [
    {
      id: "pilot-charter",
      category: "governance",
      title: "Pilot charter & board mandate",
      detail:
        "Board resolution: BER+ hosts the Board Room as a neutral briefing surface; members retain data ownership; indicative layers are labelled.",
      owner: "BER+ board + secretariat",
      when: "Q2 2026"
    },
    {
      id: "anchor-members",
      category: "members",
      title: "Anchor member circle (3–5 Mitglieder)",
      detail:
        "SEGRO Pilot-1 host plus 2–4 peers (developer, infra, public). Each names an inventory lead and signs participation / visibility MOU.",
      owner: "Member relations",
      when: "Q2–Q3 2026"
    },
    {
      id: "inventory-workshops",
      category: "members",
      title: "Inventory workshops — layer by layer",
      detail:
        "Workshop series: what each member will publish (land, infra, development opportunity) vs keep member-only; replace demo rows with signed-off entries.",
      owner: "BER+ + anchor members",
      when: "Q3 2026 onward"
    },
    {
      id: "osm-stewardship",
      category: "data",
      title: "Quarterly corridor OSM snapshot",
      detail:
        "Sponsor Overpass refresh for Schönefeld corridor; document deltas; tie to land dossier — still indicative, not cadastral.",
      owner: "BER+ data steward (part-time)",
      when: "Every quarter"
    },
    {
      id: "verify-inventory",
      category: "data",
      title: "Verify co-inventory submissions",
      detail:
        "Review proposed rows, reject duplicates, mark verified with member attestation — the badge count in Asset mgmt must mean something.",
      owner: "BER+ secretariat + member leads",
      when: "Monthly during pilot"
    },
    {
      id: "board-briefings",
      category: "coordination",
      title: "Quarterly Board Room briefings",
      detail:
        "Use this map in board sessions: gaps in inventory, new corridor asks, decisions needed per programme phase — not slide-only updates.",
      owner: "BER+ chair + programme lead",
      when: "Quarterly"
    },
    {
      id: "inquiry-ledger",
      category: "coordination",
      title: "Corridor Inquiry Ledger operations",
      detail:
        "Capture Saved matches and inbound asks; assign owner; close loop within 10 business days — demand captured, not lost in inboxes.",
      owner: "BER+ coordination desk",
      when: "From first live match"
    }
  ] satisfies PilotDeliverable[],
  investmentDeliverables: [
    {
      id: "spv-mou",
      category: "legal",
      title: "BER+ Infrastructure SPV — shareholder MOU",
      detail: "Legal entity + governance charter; equity structure for Pilot-1 capex.",
      owner: "BER+ + counsel + infra fund (TBD)",
      when: "Jun 2026",
      milestoneId: "ms-spv",
      contractId: "ctr-spv-mou"
    },
    {
      id: "segro-lease",
      category: "legal",
      title: "SEGRO — land / roofs / tenant access",
      detail: "Pilot-1 anchor site (~2.0 ha) — lease or equivalent access for Module 1.0 shell.",
      owner: "SEGRO + BER+ Infrastructure SPV",
      when: "H2 2026",
      milestoneId: "ms-pilot-close",
      contractId: "ctr-segro-lease"
    },
    {
      id: "fbb-ppa",
      category: "legal",
      title: "FBB / FEW — green PPA (anchor off-take)",
      detail: "Stable revenue stream for PV+BESS; RECs / carbon accounting aligned with airport targets.",
      owner: "FBB + BER+ Infrastructure SPV",
      when: "H2 2026",
      milestoneId: "ms-pilot-close",
      contractId: "ctr-fbb-ppa"
    },
    {
      id: "pilot-fc",
      category: "physical",
      title: "Pilot-1 financial close",
      detail: "Equity + anchor off-take sufficient to mobilize EPC — map anchor becomes a construction site.",
      owner: "BER+ Infrastructure SPV",
      when: "Dec 2026",
      milestoneId: "ms-pilot-close",
      contractId: "ctr-pilot-epc"
    },
    {
      id: "pilot-build",
      category: "physical",
      title: "Pilot-1 construction & energization",
      detail: "SEGRO North Cargo Micro-Hub mobilization → PV+BESS live → EWF Module 1.0 demo.",
      owner: "EPC lead + SEGRO",
      when: "2027",
      milestoneId: "ms-energize",
      contractId: "ctr-pilot-epc"
    }
  ] satisfies PilotDeliverable[],
  successLooksLike: [
    "≥3 anchor members with verified inventory rows on the map (not only indicative OSM).",
    "≥1 Board Room briefing where a decision is recorded against a programme milestone.",
    "Inquiry Ledger: ≥5 corridor asks captured with named owner and status.",
    "Pilot-1 FC term sheets signed (SPV, SEGRO, FBB PPA) — physical proof path credible to Länder / investors."
  ],
  disclaimer:
    "Indicative OSM, member links, and match scores in this prototype are for dialogue — not legal, planning, or investment advice."
} as const;

/** Concrete contribution areas — what BER+ e.V. does vs what members supply */
export type BerPlusContributionArea = {
  id: string;
  title: string;
  berPlusRole: string;
  memberRole: string;
  pilotExample: string;
};

export const BER_PLUS_CONTRIBUTIONS = {
  headline: "What would BER+ need to contribute?",
  intro:
    "The map does not populate itself. BER+ supplies governance, stewardship, and hosting — members supply the facts. Neither side alone makes the corridor visible.",
  areas: [
    {
      id: "collect",
      title: "Collect member data",
      berPlusRole:
        "Run onboarding workshops; publish a simple data schema; intake co-inventory submissions and member profile updates.",
      memberRole:
        "Each Mitglied names an inventory lead; declares sites, hectares, corridor role, and what may be shown publicly.",
      pilotExample:
        "3–5 anchor members replace demo rows with signed-off asset + land entries in Asset mgmt."
    },
    {
      id: "validate",
      title: "Validate locations",
      berPlusRole:
        "Review proposed map pins against OSM ids, duplicates, and corridor bounds; reject or return for correction before marking verified.",
      memberRole:
        "Attest that a row matches their portfolio; provide planning phase or availability notes where relevant.",
      pilotExample:
        "Monthly review queue — indicative → submitted → verified badge means BER+ + member both signed off."
    },
    {
      id: "ownership",
      title: "Define ownership & visibility",
      berPlusRole:
        "Publish rules: what BER+ hosts on the map vs what stays member-only; never imply cadastral title from OSM polygons.",
      memberRole:
        "Choose public / member-only flags per row; retain legal ownership — BER+ hosts visibility, not title.",
      pilotExample:
        "Workshop output: visibility MOU + legend on every layer (indicative OSM vs member-verified)."
    },
    {
      id: "maintain",
      title: "Maintain information",
      berPlusRole:
        "Quarterly OSM corridor refresh; archive stale rows; update programme milestones; keep Inquiry Ledger statuses current.",
      memberRole:
        "Notify BER+ when a site sells, phases, or new opportunity opens — trigger re-verification.",
      pilotExample:
        "Data steward (part-time) + secretariat: OSM delta log and verified-count audit each quarter."
    },
    {
      id: "host",
      title: "Host the platform",
      berPlusRole:
        "Pay for hosting, access control, backups, and Board Room uptime; chair quarterly briefings on this surface.",
      memberRole:
        "Participate in briefings; use the map in diligence and county meetings — demand drives priority.",
      pilotExample:
        "BER+ board line item: platform ops + coordination desk (not a one-off student prototype)."
    }
  ] satisfies BerPlusContributionArea[]
} as const;

/** Future Phase — realistic evolution beyond the pilot probe */
export type PlatformEvolutionPhase = {
  id: string;
  label: string;
  window: string;
  platform: string;
  berPlusRole: string;
  membersGain: string;
};

export const BER_PLUS_FUTURE_EVOLUTION = {
  headline: "Future Phase · how the platform evolves",
  intro:
    "This demo is Phase I scaffolding. Credibility comes from staged upgrades tied to Programme milestones — not a big-bang GIS replacement.",
  phases: [
    {
      id: "pilot",
      label: "Pilot · Phase I — Validate",
      window: "2026–2028",
      platform:
        "Indicative corridor map · browser co-inventory · manual Inquiry Ledger · Programme tab with term-sheet contracts.",
      berPlusRole:
        "Part-time data steward; secretariat verifies rows; quarterly OSM refresh; board briefings on this surface.",
      membersGain:
        "Shared corridor picture before site visits; captured inquiries; verified inventory for anchor circle."
    },
    {
      id: "scale",
      label: "Scale · Phase II",
      window: "2028–2031",
      platform:
        "Persistent verified registry (not browser-only) · member SSO · match routing to named owners · Pilot-N modules + corridor microgrid layer on map.",
      berPlusRole:
        "Funded coordination desk; API or structured feeds from members; O&M framework fees for replicated modules.",
      membersGain:
        "Automated match follow-up; multi-pilot inventory; infra queue timing published by utility members."
    },
    {
      id: "lead",
      label: "Lead · Phase III",
      window: "2031–2036",
      platform:
        "Full Flughafenregion coverage · EWF module export narrative · benchmark pack for other airport regions.",
      berPlusRole:
        "Platform operator or licensed vendor under BER+ governance; data standards board; export licensing path.",
      membersGain:
        "Corridor brand in investor packs; repeatable Module 1.0 story; peer citations like Schiphol / Flanders benchmarks."
    }
  ] satisfies PlatformEvolutionPhase[],
  realismNote:
    "Each step is fundable and staffable — the jump from probe to product is a budget and charter decision, not a technology miracle."
} as const;

/** Follow-up from member discussions — what belongs to whom, and how the map becomes step 1 */
export type MemberInventoryLayer = {
  id: "land" | "infrastructure" | "development" | "assets";
  title: string;
  memberQuestion: string;
  onMapToday: string;
  verifiedNext: string;
};

export const MEMBER_ASSET_INVENTORY = {
  headline: "Important next step · Member asset inventory",
  followUpQuestion: "What actually belongs to BER+ members?",
  intro:
    "A recurring question in our discussions: there is no shared answer today. Everyone knows their own dossier — not the corridor-wide picture of land, infra, and opportunities in play.",
  mapRole:
    "This Board Room map is step 1: indicative OSM + curated land anchors + member-linked highlights. Step 2 is a verified inventory co-built with Mitglieder.",
  ownership:
    "Members retain ownership of their data. BER+ hosts visibility and matching rules — it does not replace cadastre, B-Plan, or lease contracts.",
  layers: [
    {
      id: "assets",
      title: "Asset inventory",
      memberQuestion: "Which sites, buildings, and portfolios does each member actively hold or develop?",
      onMapToday: "Mitglied profiles, corridor roles, and keyword-linked OSM features (indicative).",
      verifiedNext: "Member-declared asset register with status, ha, and public/private visibility flags."
    },
    {
      id: "land",
      title: "Land inventory",
      memberQuestion: "Which parcels are in play — owned, optioned, or marketed — near the corridor?",
      onMapToday: "BER+ land anchors (Pilot-1, SEGRO park, Schönefeld Nord…) + OSM gewerbe polygons.",
      verifiedNext: "Member-validated plot boundaries, availability, and planning phase — not OSM guesses."
    },
    {
      id: "infrastructure",
      title: "Infrastructure inventory",
      memberQuestion: "Where is grid capacity, heat, logistics, and utility spine — and who operates it?",
      onMapToday: "OSM power, rail, and industry layers; infra members highlighted on the graph.",
      verifiedNext: "Utility members publish queue timing and connection points members can rely on."
    },
    {
      id: "development",
      title: "Development opportunity inventory",
      memberQuestion: "Which phased opportunities need a counterpart — land + infra + tenant + timing?",
      onMapToday: "Matching map links land ↔ member ↔ infra; programme timeline for Pilot-1 phases.",
      verifiedNext: "Opportunity cards: phase gate, developable ha, counterpart sought, review queue."
    }
  ] satisfies MemberInventoryLayer[],
  pilotSteps: [
    "Pick 3–5 anchor Mitglieder (SEGRO Pilot-1 circle first).",
    "Workshop: map what each member is willing to publish vs keep member-only.",
    "Replace indicative OSM links with signed-off inventory rows — one layer at a time.",
    "Use the Board Room in quarterly board sessions to review gaps and new opportunities."
  ],
  notYet:
    "Today: gold highlights and land anchors are curated for the probe — not legally verified ownership records."
} as const;

export type MemberPathStep = {
  problem: string;
  youSee: string;
  youDo: string;
  mapFocus: "members" | "junqingchu" | "programme" | "briefing";
};

export const CATEGORY_MEMBER_PATHS: Record<MemberCategory, MemberPathStep[]> = {
  developer: [
    {
      problem: "Which developable parcels sit near my projects?",
      youSee: "Green land parcels + amber industry zones linked to your Mitglied profile.",
      youDo: "Open your profile → OSM linked list → click parcel on map for ha & suitability.",
      mapFocus: "junqingchu"
    },
    {
      problem: "Who else is active in my corridor segment?",
      youSee: "Member zones + other Mitglieder markers along the BER+ spine.",
      youDo: "Mitglieder tab → select peers → compare OSM link counts.",
      mapFocus: "members"
    },
    {
      problem: "When does infrastructure (grid, heat) land for my phase?",
      youSee: "Programme Phase I–II milestones and Pilot-1 delivery window.",
      youDo: "Programme tab + timeline — align your planning to BER+ Phase I validate.",
      mapFocus: "programme"
    }
  ],
  investor: [
    {
      problem: "Where is investable surface area with corridor narrative?",
      youSee: "Land anchors (BER+ curated) + developable ha rollup in OSM Intel.",
      youDo: "OSM Intel → Land → filter parcels; cross-check Pilot-1 and corridor ribbon.",
      mapFocus: "junqingchu"
    },
    {
      problem: "Evidence the region is moving (not static slides)?",
      youSee: "Intelligence TV + programme status + member-linked asset growth.",
      youDo: "Use map in diligence briefings; export talking points from briefing tab.",
      mapFocus: "briefing"
    },
    {
      problem: "Which operators are already committed?",
      youSee: "Mitglieder categories + SEGRO Pilot-1 + infrastructure members (e.g. heat).",
      youDo: "Members list → filter Infrastructure / Developer → open profiles.",
      mapFocus: "members"
    }
  ],
  infrastructure: [
    {
      problem: "Where are substations, lines, and thermal loads?",
      youSee: "Power + utilities OSM layers and industry polygons near corridor.",
      youDo: "OSM Intel → Infrastructure → toggle power/utilities; click assets for tags.",
      mapFocus: "junqingchu"
    },
    {
      problem: "Which sites match district energy or microgrid pilots?",
      youSee: "Member-linked industry + land near your coordinates.",
      youDo: "Select your Mitglied → review OSM links → propose connection in BER+ forum.",
      mapFocus: "members"
    },
    {
      problem: "Alignment with BER+ Pilot-1 and scale path?",
      youSee: "Pilot-1 marker, Module 1.0 briefing, Phase I contracts.",
      youDo: "Briefing + Programme — position your service as Phase I/II enabler.",
      mapFocus: "programme"
    }
  ],
  consulting: [
    {
      problem: "One map for client workshops on the Flughafenregion?",
      youSee: "Unified corridor + OSM + members + intel — Board Room on one screen.",
      youDo: "Lead workshops from map; toggle categories per client sector.",
      mapFocus: "junqingchu"
    },
    {
      problem: "Traceable OSM evidence (not black-box slides)?",
      youSee: "Per-feature OSM id, tags summary, BER+ score on popup.",
      youDo: "Click features → cite osmType/osmId in deliverables (indicative only).",
      mapFocus: "junqingchu"
    },
    {
      problem: "Programme delivery credibility?",
      youSee: "Milestones, contracts, phase banner on timeline.",
      youDo: "Programme tab for Arcadis-style programme management narrative.",
      mapFocus: "programme"
    }
  ],
  public: [
    {
      problem: "Show regional development momentum to Länder / county?",
      youSee: "Corridor zone, member zones, land ha, Pilot-1, intelligence headlines.",
      youDo: "Briefing narrative + map screenshot pack for WFG / economic dev meetings.",
      mapFocus: "briefing"
    },
    {
      problem: "Which companies map to which opportunities?",
      youSee: "Member–OSM link counts and gold-highlighted member assets.",
      youDo: "Mitglieder → economic development members → linked sites list.",
      mapFocus: "members"
    },
    {
      problem: "Transparent 12–24 month steps (not 2045)?",
      youSee: "Phase I end 2028, Pilot-1 validate, explicit ‘indicative OSM’ disclaimer.",
      youDo: "Use coordination tab first step bullets in funding applications.",
      mapFocus: "programme"
    }
  ]
};

/** Optional per-member overrides (shortName keys) */
export const MEMBER_PATH_OVERRIDES: Partial<
  Record<string, { headline: string; steps: MemberPathStep[] }>
> = {
  buwog: {
    headline: "Housing & Schönefeld Nord — land + ÖPNV context",
    steps: [
      {
        problem: "Where is NEUE MITTE / Schönefeld Nord in the corridor story?",
        youSee: "Curated land anchors (Neue Mitte, Schönefeld Nord) + your OSM links.",
        youDo: "Profile → land anchors → OSM Intel Land tab → fly to site on map.",
        mapFocus: "junqingchu"
      },
      {
        problem: "Infrastructure narrative for ÖPNV + sustainability quotes?",
        youSee: "Transport layer + briefing dilemma (grid, resilience).",
        youDo: "Toggle transport lines; use briefing for stakeholder dialogue.",
        mapFocus: "briefing"
      }
    ]
  },
  segro: {
    headline: "Pilot-1 host — proof site for Module 1.0",
    steps: [
      {
        problem: "Where is Pilot-1 on the corridor spine?",
        youSee: "Green Pilot-1 marker + SEGRO profile + Phase I programme.",
        youDo: "Click Pilot-1 on map → Programme Phase I milestones.",
        mapFocus: "programme"
      },
      {
        problem: "What infra surrounds the pilot for scale story?",
        youSee: "Industry + power OSM near Pilot-1; member zone highlight.",
        youDo: "OSM Intel around Pilot-1 coordinates; document in investor pack.",
        mapFocus: "junqingchu"
      }
    ]
  },
  "wfg-lds": {
    headline: "Economic development — regional coordination",
    steps: [
      {
        problem: "Portfolio view for Dahme-Spreewald / airport region?",
        youSee: "All Mitglieder + member zones + developable ha summary.",
        youDo: "Members (all) + OSM land rollup → export for county strategy.",
        mapFocus: "members"
      }
    ]
  }
};
