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
};

export type GrafCrossrefPayload = {
  summary: {
    namedSites: number;
    withExactCount: number;
    predictedSites: number;
    sumPredictedEmployees: number;
    sumSiteLevelEmployees: number;
    sumCorridorIndicative: number;
    groupLevelMatches: number;
    siteLevelMatches: number;
  };
  records: GrafEmployeeRecord[];
};
