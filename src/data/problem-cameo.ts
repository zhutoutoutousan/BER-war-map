import type { MemberCategory } from "@/data/mitglieder";
import type { GuestPersona } from "@/lib/guest-personas";
import { BRAND } from "@/lib/brand";

/** Universal pains — no platform mention (Act 1) */
export const UNIVERSAL_CORRIDOR_PAINS = [
  {
    id: "visibility",
    title: "Assets stay invisible",
    body: "Land, grid, logistics, and programme milestones live in PDFs, portals, and member decks — never on the same map at the same time."
  },
  {
    id: "availability",
    title: "Members can't see what's available",
    body: "Everyone knows their own sites. Nobody browses what is actually in play nearby — availability stays implicit, not explorable."
  },
  {
    id: "fragmentation",
    title: "Opportunities are fragmented",
    body: "A real opportunity needs land + infra timing + counterpart + phase. Those four facts sit in four silos — matching restarts by email every time."
  },
  {
    id: "navigation",
    title: "The ecosystem is hard to navigate",
    body: "Investors, companies, municipalities, and partners each carry a different mental map. There is no neutral front door into the corridor."
  }
] as const;

export type CameoPersona = GuestPersona | "member";

export type CameoBeat = {
  id: string;
  kind: "title" | "scene" | "game" | "punchline" | "response";
  heading?: string;
  body?: string;
  caption?: string;
};

export type CameoGameOption = {
  id: string;
  label: string;
  detail: string;
  /** All options are "wrong" or incomplete — the point is to struggle */
  feedback: string;
};

export type CameoFragment = {
  id: string;
  label: string;
  short: string;
};

export type CameoVisual = {
  /** One-line quest inside the title card */
  quest: string;
  /** Floating silo chips — disconnected sources */
  fragments: readonly CameoFragment[];
  /** Bottom stat line */
  stat: string;
};

export type PersonaCameo = {
  persona: CameoPersona;
  label: string;
  tagline: string;
  scenario: string;
  task: string;
  options: CameoGameOption[];
  punchline: string;
  punchlineSub: string;
  responseHeading: string;
  responseBody: string;
  visual: CameoVisual;
  beats: CameoBeat[];
};

const PLATFORM_RESPONSE = {
  responseHeading: "What if the association hosted one view?",
  responseBody: `${BRAND.name} is a probe — not cadastral GIS, not a command centre. A neutral briefing surface where corridor assets, members, and programme timing become visible and linkable.`
};

function personaCameo(
  persona: CameoPersona,
  label: string,
  tagline: string,
  scenario: string,
  task: string,
  options: CameoGameOption[],
  punchline: string,
  punchlineSub: string,
  visual: CameoVisual
): PersonaCameo {
  return {
    persona,
    label,
    tagline,
    scenario,
    task,
    options,
    punchline,
    punchlineSub,
    visual,
    ...PLATFORM_RESPONSE,
    beats: [
      {
        id: "title",
        kind: "title",
        heading: label,
        body: tagline,
        caption: "Corridor briefing · Schönefeld Flughafenregion"
      },
      { id: "scene", kind: "scene", heading: "The situation", body: scenario },
      { id: "game", kind: "game", heading: "Your move", body: task },
      {
        id: "punchline",
        kind: "punchline",
        heading: punchline,
        body: punchlineSub
      },
      {
        id: "response",
        kind: "response",
        heading: PLATFORM_RESPONSE.responseHeading,
        body: PLATFORM_RESPONSE.responseBody
      }
    ]
  };
}

export const PERSONA_CAMEOS: Record<GuestPersona, PersonaCameo> = {
  company: personaCameo(
    "company",
    "Company · location search",
    "You need logistics-adjacent land — fast.",
    "Your expansion lead asks for ~5 ha near cargo and grid within the BER corridor. You have four sources. None share the same map.",
    "Pick the parcel you'd bet a site visit on — with only these fragments:",
    [
      {
        id: "pdf",
        label: "Member PDF",
        detail: "“~4.2 ha brownfield, south of cargo — status unclear.”",
        feedback: "Ha figure from 2023 — no grid hook-up named."
      },
      {
        id: "email",
        label: "Municipality email",
        detail: "“Gewerbe reserve in planning — coordinates on request.”",
        feedback: "Coordinates never arrived. Meeting scheduled in 3 weeks."
      },
      {
        id: "website",
        label: "Invest portal snippet",
        detail: "“Prime logistics corridor” — no plot boundary.",
        feedback: "Marketing language — not actionable for your CFO."
      },
      {
        id: "call",
        label: "Airport call note",
        detail: "“Talk to SEGRO about north belt.”",
        feedback: "Intro helpful — but is the land actually available?"
      }
    ],
    "Four sources. Zero shared geography.",
    "You'd need three meetings before knowing if any of these is real. That's the coordination tax.",
    {
      quest: "~5 ha · cargo belt · grid hook-up",
      fragments: [
        { id: "pdf", label: "Member PDF", short: "4.2 ha?" },
        { id: "email", label: "Municipality", short: "coords TBD" },
        { id: "web", label: "Invest portal", short: "no boundary" },
        { id: "call", label: "Airport note", short: "talk to SEGRO" }
      ],
      stat: "4 sources · 0 shared map"
    }
  ),
  investor: personaCameo(
    "investor",
    "Investor · opportunity screen",
    "Build a shortlist — thesis in hand, map missing.",
    "Thesis: logistics surface + corridor narrative + visible developable ha. You receive five names. No map, no phase timing, no infra queue.",
    "Mark each opportunity Invest / Maybe / Pass — names only:",
    [
      {
        id: "a",
        label: "North belt parcel",
        detail: "Named in member deck — no ha rollup.",
        feedback: "Could be strong — or already spoken for."
      },
      {
        id: "b",
        label: "Pilot-1 anchor",
        detail: "SEGRO micro-hub — programme link unclear.",
        feedback: "Narrative fits — timing vs grid unknown."
      },
      {
        id: "c",
        label: "OSM industrial polygon",
        detail: "Tagged on a planning map — no owner.",
        feedback: "Visible on a screenshot — not in your model."
      },
      {
        id: "d",
        label: "Regional press clip",
        detail: "“Major logistics interest” — no site ID.",
        feedback: "Signal without substance."
      }
    ],
    "Every row is plausible. None is verifiable.",
    "Fragmentation means you pass on good deals and keep weak ones — because evidence isn't shared.",
    {
      quest: "Logistics thesis · developable ha · phase timing",
      fragments: [
        { id: "deck", label: "Member deck", short: "no ha rollup" },
        { id: "pilot", label: "Pilot-1", short: "timing?" },
        { id: "osm", label: "OSM tag", short: "no owner" },
        { id: "press", label: "Press clip", short: "no site ID" }
      ],
      stat: "5 names · no verifiable layer"
    }
  ),
  municipality: personaCameo(
    "municipality",
    "Municipality · board question",
    "One slide. Four silos. No shared timeline.",
    "The board asks: What changed in the corridor this quarter? You pull four updates — airport, developer, utility, member association.",
    "Can you answer with one coherent briefing line?",
    [
      {
        id: "airport",
        label: "Airport update",
        detail: "Cargo expansion milestone — internal date only.",
        feedback: "True for FBB — not linked to land parcels."
      },
      {
        id: "dev",
        label: "Developer note",
        detail: "SEGRO phase gate — no public programme sync.",
        feedback: "Real progress — invisible to partners."
      },
      {
        id: "grid",
        label: "Utility queue",
        detail: "Grid delay cited — no map of affected sites.",
        feedback: "Explains stall — doesn't locate impact."
      },
      {
        id: "member",
        label: "BER+ member pulse",
        detail: "Members want better asset visibility — no shared view yet.",
        feedback: "The pain is named — the picture isn't."
      }
    ],
    "You cannot stitch one answer without a host.",
    "Regional coordination fails at the briefing layer — before any permit is filed.",
    {
      quest: "Board asks: what changed this quarter?",
      fragments: [
        { id: "airport", label: "Airport", short: "internal date" },
        { id: "dev", label: "Developer", short: "phase gate" },
        { id: "grid", label: "Utility", short: "no map" },
        { id: "ber", label: "BER+", short: "pain named" }
      ],
      stat: "4 silos · 1 slide deadline"
    }
  ),
  explore: personaCameo(
    "explore",
    "Board chair · connect the dots",
    "Four requests. Four assets. Text only.",
    "Match each inbound request to the best corridor asset — company plot search, investor ha question, grid timing, member intro. You have a list, not a map.",
    "Which match would you stake your reputation on?",
    [
      {
        id: "m1",
        label: "Match A",
        detail: "Company ↔ land near cargo",
        feedback: "Sounds right — distance unverified."
      },
      {
        id: "m2",
        label: "Match B",
        detail: "Investor ↔ Pilot-1 narrative",
        feedback: "Story fits — developable ha unknown."
      },
      {
        id: "m3",
        label: "Match C",
        detail: "Utility ↔ stalled gewerbe",
        feedback: "Likely linked — no shared layer proves it."
      },
      {
        id: "m4",
        label: "Match D",
        detail: "Member ↔ OSM industrial tag",
        feedback: "Keyword match — not validated proximity."
      }
    ],
    "Every match is defensible in a meeting. None is provable on a map.",
    "That's why a neutral Board Room surface matters — for the association, not any single member.",
    {
      quest: "Four inbound requests · one corridor",
      fragments: [
        { id: "co", label: "Company plot", short: "unverified" },
        { id: "inv", label: "Investor ha", short: "unknown" },
        { id: "grid", label: "Grid timing", short: "unlinked" },
        { id: "intro", label: "Member intro", short: "by email" }
      ],
      stat: "4 matches · text only"
    }
  )
};

export const MEMBER_CAMEO = personaCameo(
  "member",
  "Mitglied · your corridor slice",
  "You know your sites — not the combined picture.",
  "A peer asks what land and infra sits within reach of your project. You open your dossier. It doesn't show their zone, shared grid, or linked OSM context.",
  "What do you send them?",
  [
    {
      id: "deck",
      label: "Your investor deck",
      detail: "Strong on your assets — silent on neighbours.",
      feedback: "Accurate for you — incomplete for matching."
    },
    {
      id: "crm",
      label: "CRM export",
      detail: "Contacts and notes — no geography.",
      feedback: "Relationship data — not spatial intelligence."
    },
    {
      id: "pdf",
      label: "Land PDF",
      detail: "One parcel — no corridor spine.",
      feedback: "Single site — not ecosystem view."
    },
    {
      id: "wait",
      label: "“Let me ask around”",
      detail: "Manual intros — weeks of latency.",
      feedback: "How BER+ matching works today — by email."
    }
  ],
  "Membership value stays partial without shared visibility.",
  "Members asked for better asset discovery — not another portal that ignores the map.",
  {
    quest: "Peer asks: what's in reach of your project?",
    fragments: [
      { id: "deck", label: "Your deck", short: "your sites only" },
      { id: "crm", label: "CRM export", short: "no geography" },
      { id: "pdf", label: "Land PDF", short: "one parcel" },
      { id: "wait", label: "Ask around", short: "weeks" }
    ],
    stat: "Your dossier · not the corridor"
  }
);

export function cameoForGuest(persona: GuestPersona): PersonaCameo {
  return PERSONA_CAMEOS[persona];
}

export function cameoForMemberCategory(category: MemberCategory): PersonaCameo {
  if (category === "investor") return PERSONA_CAMEOS.investor;
  if (category === "public") return PERSONA_CAMEOS.municipality;
  if (category === "developer") return PERSONA_CAMEOS.company;
  return MEMBER_CAMEO;
}
