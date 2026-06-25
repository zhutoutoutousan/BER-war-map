/** Beschäftigungstiefe — Board Room briefing copy */
export const GRAF_BRIEFING = {
  route: "/beschaeftigung",
  title: "Beschäftigungstiefe near Schönefeld",
  subtitle: "Workforce depth briefing — June 2026 BER+ board signal",
  attribution: {
    signal: "June 2026 board session",
    context: "Alpine Immobilien · BER+ 2. Vorsitzender",
    project: "BB Business Hub, Schönefeld"
  },
  quote:
    "Do firms near Schönefeld employ enough people — will a new Büro/Gewerbe project find tenants and Fachkräfte?",
  reframe: {
    not: "Not primarily construction or factory labour on site.",
    rather:
      "Rather Beschäftigungstiefe — how many firms and jobs exist; can new office & gewerbe attract tenants; can they recruit skilled staff from the wider catchment."
  },
  dataPipeline: [
    {
      title: "OSM gewerbe layer",
      body: "643 features in Schönefeld bbox from Overpass — physical presence of economic activity."
    },
    {
      title: "Public cross-reference",
      body: "Geschäftsberichte, member news (BB Hub), registry excerpts (FBB). Konzern totals (REWE, EDEKA, DHL global) are reference only — never copied onto a single Filiale pin."
    },
    {
      title: "SME heuristics",
      body: "Micro-establishments (lawyers, tax advisors, retail) get range-only estimates — not point sums."
    }
  ],
  modelSteps: [
    {
      title: "Start with what is published",
      body: "Annual reports, member news (BB Hub ~800 jobs), and registry excerpts (FBB ~2,131) anchor the story."
    },
    {
      title: "Classify each site by business type",
      body: "Logistics depots, Werkstätten, Gewerbeparks, and retail units follow different typical staffing — informed by German Mittelstand structure."
    },
    {
      title: "Apply corridor context",
      body: "Locations near BER inherit slightly higher job-density assumptions, reflecting the 2025 Flughafenregion labour study (Fachkräftegewinnung as top challenge)."
    }
  ],
  predictionModel: {
    title: "Prediction model — how the 102 site estimates are derived",
    intro:
      "For named OSM sites with no public headcount we apply a transparent statistical model (not a black box). Each site gets a P25–P75 range and one planning number inside that range.",
    formula:
      "planning value = P25 + seed × (P75 − P25)   ·   seed = stable hash(site id) ∈ [0, 1]",
    steps: [
      {
        title: "1 · Sector prior (Destatis-inspired)",
        body: "Default employees-per-establishment by OSM landuse: company ~12, industrial ~35, commercial ~10, logistics ~42, etc. (P25 / P50 / P75)."
      },
      {
        title: "2 · Keyword rules",
        body: "Name/operator patterns override the sector prior — e.g. Gewerbepark, Logistikzentrum, Expo, hotel, Werkstatt, airport building codes (Y0xx)."
      },
      {
        title: "3 · Area density (optional)",
        body: "If OSM polygon area is known: employees ≈ hectares × density (industrial ~6/ha, commercial ~12/ha), merged with the prior as a floor."
      },
      {
        title: "4 · Airport-corridor uplift",
        body: "Distance to BER adjusts P25–P75: ≤6 km +15%, 6–12 km +8%, beyond 12 km no uplift (FBB/WFBB/IHK labour-market context)."
      },
      {
        title: "5 · Duplicate splitting",
        body: "Multiple OSM nodes for the same facility name share one prior — headcount split across nodes unless it is an aggregate (e.g. Gewerbepark)."
      }
    ],
    outputs: [
      "employeesRange — conservative to optimistic interval (P25–P75 after uplift)",
      "employees — single planning number inside the range (reproducible from site id)",
      "prediction.prior — which rule or sector matched",
      "confidence: predicted — always flagged in UI and table"
    ],
    exclusions: [
      "Corporate group totals (DHL global, REWE group) are never treated as local Schönefeld headcount",
      "Predictions are not audited Beschäftigtenzahlen — member validation required"
    ]
  },
  pilot: {
    horizonDays: 90,
    anchors: ["Alpine Immobilien", "SEGRO", "BUWOG", "WFG Dahme-Spreewald", "Sector Seven"],
    steps: [
      { title: "Map the question", body: "Publish this briefing on the Board Room map." },
      { title: "Validate with members", body: "Alpine + 3–5 anchors confirm headcount ranges per site." },
      { title: "Brief the board", body: "One recorded corridor session with Pilot-1 context." }
    ]
  },
  disclaimer:
    "Indicative probe only — model estimates and public references, not audited Beschäftigtenzahlen. Member validation required before leasing narratives."
} as const;

export type GrafPredictionMeta = {
  p25: number;
  p50: number;
  p75: number;
  prior: string;
  corridorUplift?: string | null;
  method?: string;
};

export type GrafEmployeeRecord = {
  id: string;
  name: string;
  landuse: string;
  lat: number;
  lon: number;
  named?: boolean;
  employees: number | null;
  employeesRange: string | null;
  scope: string | null;
  source: string | null;
  confidence: string;
  prediction?: GrafPredictionMeta;
  groupCorporate?: { employees: number; source: string };
};

export type GrafCrossrefPayload = {
  generatedAt?: string;
  methodology?: string;
  predictionsMeta?: {
    model: string;
    references: string[];
    disclaimer: string;
  };
  summary: {
    namedSites: number;
    withExactCount?: number;
    predictedSites: number;
    sumPredictedEmployees: number;
    sumSiteLevelEmployees?: number;
    sumCorridorIndicative: number;
    groupLevelMatches?: number;
    siteLevelMatches?: number;
    methodology?: string;
    totalSites?: number;
  };
  records: GrafEmployeeRecord[];
};

export type GrafCorridorSnapshot = {
  summary: { totalElements: number; namedSites: number };
  sites: { id: string; lat: number; lon: number; named?: boolean; name?: string | null }[];
};

/** Planning weight for heatmap / bubble size (never uses Konzern ref alone). */
export function employmentWeight(r: GrafEmployeeRecord): number {
  if (r.employees != null && r.employees > 0) return r.employees;
  if (r.employeesRange) {
    const m = r.employeesRange.match(/(\d+)[–-](\d+)/);
    if (m) return Math.round((Number(m[1]) + Number(m[2])) / 2);
  }
  return 4;
}
