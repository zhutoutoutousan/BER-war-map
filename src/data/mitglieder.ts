/**
 * BER+ Mitglieder — profiles + map placements.
 * Official names & URLs: src/data/ber-plus-members-menu.ts (ber-plus.de nav).
 * Map coordinates are draft corridor placements (not surveyed GIS).
 */

import { BER_PLUS_MEMBERS_MENU, BER_PLUS_MENU_BY_ID } from "./ber-plus-members-menu";

export type MemberCategory =
  | "developer"
  | "investor"
  | "infrastructure"
  | "consulting"
  | "public";

export type Mitglied = {
  id: string;
  name: string;
  shortName: string;
  category: MemberCategory;
  corridorRole: string;
  intro: string;
  introDe?: string;
  /** Official link from ber-plus.de Mitglieder menu */
  website: string;
  /** Optional BER-corridor project / campus page */
  projectUrl?: string;
  coordinates: [number, number];
  quote?: string;
  quoteAuthor?: string;
  tags?: string[];
};

export const CATEGORY_LABELS: Record<MemberCategory, string> = {
  developer: "Developer / Bauträger",
  investor: "Investor",
  infrastructure: "Infrastructure / Energy",
  consulting: "Consulting / Engineering",
  public: "Public / Economic dev."
};

export const CATEGORY_COLORS: Record<MemberCategory, string> = {
  developer: "#f59e0b",
  investor: "#a78bfa",
  infrastructure: "#fb923c",
  consulting: "#38bdf8",
  public: "#22d3ee"
};

function menuUrl(id: string): string {
  return BER_PLUS_MENU_BY_ID[id]?.url ?? "";
}

/** Rich profiles; order follows ber-plus.de menu via sortMitgliederByMenu() */
const MITGLIEDER_PROFILES: Mitglied[] = [
  {
    id: "adler",
    name: "Adler AG",
    shortName: "Adler",
    category: "investor",
    corridorRole: "Residential & commercial portfolio investor",
    intro:
      "Listed real estate company with residential and commercial holdings — investor perspective on capital deployment and asset performance in growth corridors.",
    website: menuUrl("adler"),
    coordinates: [13.368, 52.332],
    tags: ["investor", "portfolio"]
  },
  {
    id: "alpine",
    name: "Alpine Immobilien GmbH",
    shortName: "Alpine",
    category: "developer",
    corridorRole: "Regional property development",
    intro:
      "Property developer active in Berlin-Brandenburg — contributes local development capacity and project pipeline in the extended airport region.",
    website: menuUrl("alpine"),
    coordinates: [13.352, 52.325],
    tags: ["development"]
  },
  {
    id: "arcadis",
    name: "Arcadis",
    shortName: "Arcadis",
    category: "consulting",
    corridorRole: "Engineering, environment & programme delivery",
    intro:
      "Global design and consultancy for natural and built assets — corridor infrastructure, environmental compliance, and integrated programme management around BER.",
    website: menuUrl("arcadis"),
    coordinates: [13.405, 52.345],
    tags: ["engineering", "ESG", "programme"]
  },
  {
    id: "buwog",
    name: "BUWOG Bauträger GmbH",
    shortName: "BUWOG",
    category: "developer",
    corridorRole: "Residential & quartier development — Schönefeld / airport community",
    intro:
      "Major residential developer active in the Flughafenregion (e.g. BUWOG NEUE MITTE SCHÖNEFELD). Brings sustainable urban housing and participates in Schönefeld Nord masterplan dialogue via BER+.",
    introDe:
      "Wohnungsbauträger mit Projekten in Schönefeld (u. a. NEUE MITTE SCHÖNEFELD). Verbindet Wohnen, Nachhaltigkeit und regionale Quartiersentwicklung.",
    website: menuUrl("buwog"),
    coordinates: [13.582, 52.392],
    quote:
      "Berlin und Brandenburg müssen die Entwicklung rund um den BER gemeinsam denken – gerade bei den Themen Infrastruktur, Nachhaltigkeit und ÖPNV.",
    quoteAuthor: "Eva Weiß, BUWOG Bauträger GmbH",
    tags: ["housing", "sustainability", "ÖPNV"]
  },
  {
    id: "edistherm",
    name: "e.distherm Wärmedienstleistungen GmbH",
    shortName: "e.distherm",
    category: "infrastructure",
    corridorRole: "District heating & thermal networks",
    intro:
      "Energy services for district heating (Wärmedienstleistungen) — decarbonizing thermal loads and linking to microgrid / EWF thermal concepts in industrial zones.",
    website: menuUrl("edistherm"),
    coordinates: [13.548, 52.385],
    tags: ["heat", "decarbonization", "utilities"]
  },
  {
    id: "gsg",
    name: "GSG Berlin",
    shortName: "GSG",
    category: "developer",
    corridorRole: "Urban regeneration & mixed-use (Berlin link to corridor)",
    intro:
      "Berlin-based urban development company — connects capital-region urban renewal with BER+ corridor growth dynamics.",
    website: menuUrl("gsg"),
    coordinates: [13.298, 52.298],
    tags: ["urban", "mixed-use"]
  },
  {
    id: "reiss",
    name: "Reiß & Co.",
    shortName: "Reiß",
    category: "consulting",
    corridorRole: "Commercial brokerage & transaction support",
    intro:
      "Commercial real estate advisory — transactions, leasing, and market intelligence for investors active around BER.",
    website: menuUrl("reiss"),
    coordinates: [13.318, 52.308],
    tags: ["brokerage", "transactions"]
  },
  {
    id: "sector-seven",
    name: "Sector Seven Investors GmbH",
    shortName: "Sector Seven",
    category: "investor",
    corridorRole: "Private capital — airport-region assets",
    intro:
      "Investment company focused on real assets — equity perspective for corridor modules and opportunistic development in the Flughafenregion.",
    website: menuUrl("sector-seven"),
    coordinates: [13.428, 52.362],
    tags: ["private-equity", "capital"]
  },
  {
    id: "taurecon",
    name: "Taurecon Real Estate Consulting GmbH",
    shortName: "Taurecon",
    category: "consulting",
    corridorRole: "Real estate & corridor strategy advisory",
    intro:
      "Real estate consulting for investors and developers in the BER growth region — strategic positioning for airport-corridor assets.",
    introDe: "Immobilienberatung für Investoren und Projektentwickler in der Flughafenregion.",
    website: menuUrl("taurecon"),
    coordinates: [13.455, 52.358],
    quote:
      "Durch die BER-Eröffnung entsteht eine neue Dynamik in der Region. Damit wird es dringender, eine strategische Umfeld-Entwicklung voran zu bringen.",
    quoteAuthor: "Thomas Bergander, Taurecon Real Estate GmbH",
    tags: ["strategy", "advisory"]
  },
  {
    id: "wfg-lds",
    name: "Wirtschaftsförderung Dahme-Spreewald (WFG)",
    shortName: "WFG LDS",
    category: "public",
    corridorRole: "County economic development — policy alignment & site marketing",
    intro:
      "100% subsidiary of Landkreis Dahme-Spreewald. Settlement support, funding advice, ZLR Wildau (aviation/tech cluster) — BER+ policy alignment partner.",
    introDe:
      "Wirtschaftsförderung des Landkreises — Ansiedlung, Förderberatung, Zentrum für Luft- und Raumfahrt Schönefelder Kreuz (Wildau).",
    website: menuUrl("wfg-lds"),
    coordinates: [13.633, 52.325],
    tags: ["policy", "ZLR", "settlement"]
  },
  {
    id: "wfb",
    name: "Wirtschaftsinitiative Flughafenregion Brandenburg (WFB)",
    shortName: "WFB",
    category: "public",
    corridorRole: "Regional business initiative — Flughafenregion network",
    intro:
      "Business initiative for Brandenburg's airport region — stakeholder dialogue, marketing, and regional competitiveness around BER.",
    website: menuUrl("wfb"),
    coordinates: [13.495, 52.364],
    tags: ["network", "Brandenburg", "SME"]
  },
  {
    id: "periskop",
    name: "Periskop Partners",
    shortName: "Periskop",
    category: "consulting",
    corridorRole: "Investor alignment & project development coordination",
    intro:
      "Partnership and project-development advisory — aligning vision, governance, and authority engagement for corridor-scale developments.",
    introDe: "Beratung für Projektentwicklung und Investorenabstimmung im Flughafenumfeld.",
    website: menuUrl("periskop"),
    coordinates: [13.442, 52.352],
    quote:
      "Die Bildung der Interessengemeinschaft ist ein großer Vorteil für den Standort und ermöglicht den Investoren, eine gemeinsame Vision mit gemeinsamer Stimme zu entwickeln.",
    quoteAuthor: "Jan-Steffen Iser, Periskop Partners",
    tags: ["governance", "coordination"]
  },
  {
    id: "goldbeck",
    name: "GOLDBECK",
    shortName: "GOLDBECK",
    category: "infrastructure",
    corridorRole: "Industrial & logistics construction — modular delivery",
    intro:
      "Turnkey construction and real estate developer — potential delivery partner for standardized Resilience Module shells and corridor logistics assets.",
    website: menuUrl("goldbeck"),
    coordinates: [13.385, 52.338],
    tags: ["construction", "modular", "logistics"]
  },
  {
    id: "segro",
    name: "SEGRO",
    shortName: "SEGRO",
    category: "developer",
    corridorRole: "Land, roofs & tenants — Pilot-1 anchor site",
    intro:
      "European logistics and light-industrial developer. SEGRO Park Berlin Airport / Logistics Park Schönefeld adjacent to BER — key land partner for Pilot-1 (North Cargo Micro-Hub).",
    introDe:
      "Logistik- und Gewerbeflächen am BER — zentraler Flächenpartner für Pilot-1.",
    website: menuUrl("segro"),
    projectUrl:
      "https://www.segro.com/countries-repository/germany/segro-park-berlin-airport",
    coordinates: [13.518, 52.372],
    quote:
      "Der Dialog und die gemeinsame Weiterentwicklung des Flughafenumfeldes im Rahmen von BER+ sind SEGRO ein besonderes Anliegen.",
    quoteAuthor: "Pauline Wolters, SEGRO Deutschland",
    tags: ["pilot-1", "logistics", "PPA-potential"]
  }
];

export function sortMitgliederByMenu(members: Mitglied[]): Mitglied[] {
  const order = new Map(BER_PLUS_MEMBERS_MENU.map((e, i) => [e.id, i]));
  return [...members].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export const MITGLIEDER: Mitglied[] = sortMitgliederByMenu(MITGLIEDER_PROFILES);

export const BER_PLUS_CHAIR = {
  name: "Birgit Detig",
  role: "1. Vorsitzende, IG Umfeld BER e.V. (BER+)",
  quote:
    "Mit Start des neuen Flughafens richtet sich der Blick in die Zukunft: Es gilt, ein attraktives Umfeld zu schaffen – für neue Technologien, neue Arbeitsplätze, neues Wohnen und nachhaltige Infrastruktur.",
  orgUrl: "https://www.ber-plus.de/"
};

export function getMitgliedById(id: string): Mitglied | undefined {
  return MITGLIEDER.find((m) => m.id === id);
}

export function mitgliederToGeoJSON(members: Mitglied[] = MITGLIEDER): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: members.map((m) => ({
      type: "Feature",
      id: m.id,
      properties: {
        id: m.id,
        name: m.name,
        shortName: m.shortName,
        category: m.category,
        corridorRole: m.corridorRole,
        intro: m.intro,
        website: m.website,
        projectUrl: m.projectUrl ?? "",
        quote: m.quote ?? "",
        quoteAuthor: m.quoteAuthor ?? "",
        color: CATEGORY_COLORS[m.category]
      },
      geometry: {
        type: "Point",
        coordinates: m.coordinates
      }
    }))
  };
}
