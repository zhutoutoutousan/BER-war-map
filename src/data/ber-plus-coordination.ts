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
    berPlusWhy: "BER+ can host a neutral war-room view: programme phase, Pilot-1, corridor spine, live intel.",
    platformAnswer:
      "Programme timeline + Pilot-1 + intelligence feed + shared map — one briefing surface for leadership.",
    firstStep: "Use war room in quarterly BER+ board briefings; capture “decisions needed” per phase."
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
    { label: "Platform", detail: "War-room map as shared coordination surface (this prototype)" },
    { label: "Matching", detail: "Member ↔ OSM ↔ land anchor links (keyword + proximity rules)" },
    { label: "Intelligence", detail: "Corridor RSS / YouTube feed + OSM infrastructure dossier" },
    { label: "Advocacy", detail: "Evidence packs for Länder / grid / ÖPNV dialogue (briefing tab)" }
  ],
  horizon: "12–24 months: indicative OSM, member links, quarterly intel — not cadastral GIS replacement."
};

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
      youSee: "Unified corridor + OSM + members + intel — war-room single screen.",
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
