/**
 * Credible benchmarks — not copies. Sources on-slide / in-app for BER+ Friday pitch.
 * Categories align with stakeholder feedback + instructor "use evidence".
 * Extended with map coordinates, programme, stakeholders & matching patterns for global view.
 */

export type BenchmarkCategory =
  | "airport-region"
  | "location-intelligence"
  | "invest-portal"
  | "stakeholder-dashboard";

export type BenchmarkStakeholder = {
  name: string;
  role: string;
};

export type BenchmarkMilestone = {
  label: string;
  date?: string;
  status?: "done" | "active" | "planned";
};

export type BenchmarkProgramme = {
  horizon: string;
  phaseLabel: string;
  milestones: BenchmarkMilestone[];
};

export type BenchmarkMatching = {
  pattern: string;
  scale?: string;
};

export type Benchmark = {
  id: string;
  category: BenchmarkCategory;
  name: string;
  region: string;
  whatTheyDo: string;
  evidence: string;
  lessonForBerPlus: string;
  sourceUrl: string;
  sourceLabel: string;
  /** [lng, lat] — representative HQ, airport or corridor anchor */
  coordinates: [number, number];
  mapZoom?: number;
  programme?: BenchmarkProgramme;
  stakeholders?: BenchmarkStakeholder[];
  matching?: BenchmarkMatching[];
  /** GIS / OSM / open-data angle when relevant */
  dataNote?: string;
};

export const BENCHMARK_CATEGORIES: Record<BenchmarkCategory, string> = {
  "airport-region": "Airport-region coordination",
  "location-intelligence": "Location intelligence platforms",
  "invest-portal": "Regional development & invest portals",
  "stakeholder-dashboard": "Innovation & stakeholder surfaces"
};

export const BENCHMARK_CATEGORY_COLORS: Record<BenchmarkCategory, string> = {
  "airport-region": "#a78bfa",
  "location-intelligence": "#f59e0b",
  "invest-portal": "#22d3ee",
  "stakeholder-dashboard": "#f472b6"
};

export const BENCHMARKS: Benchmark[] = [
  {
    id: "amsterdam-airport-city",
    category: "airport-region",
    name: "Amsterdam Airport City",
    region: "Schiphol · Haarlemmermeer · NL",
    coordinates: [4.7639, 52.3086],
    mapZoom: 10.5,
    whatTheyDo:
      "Public-facing invest portal for 59 business parks around Schiphol — greenfield/brownfield, EMEA HQ narrative, ecosystem positioning.",
    evidence: "700+ international companies; Schiphol as multimodal core of the metropolitan invest story.",
    lessonForBerPlus:
      "BER+ can host a neutral Flughafenregion story — not one developer's brochure — with Pilot-1 and corridor assets on one map.",
    sourceUrl: "https://www.amsterdamairportcity.com/",
    sourceLabel: "amsterdamairportcity.com",
    programme: {
      horizon: "2000s–ongoing",
      phaseLabel: "Mature invest portal + business-park network",
      milestones: [
        { label: "59 business parks on interactive map", status: "done" },
        { label: "Sector storytelling (logistics, HQ, life sciences)", status: "active" },
        { label: "Investor concierge + site visits", status: "active" }
      ]
    },
    stakeholders: [
      { name: "Schiphol Group", role: "Airport operator & area developer" },
      { name: "Haarlemmermeer municipality", role: "Zoning & permits" },
      { name: "Amsterdam Metropolitan Area", role: "Invest narrative" },
      { name: "59 business-park operators", role: "Site supply" }
    ],
    matching: [
      { pattern: "Investor → business park / plot", scale: "59 parks, 700+ companies" },
      { pattern: "Sector lead → EMEA HQ candidates", scale: "Multimodal corridor pitch" }
    ]
  },
  {
    id: "schiphol-aaa",
    category: "airport-region",
    name: "Amsterdam Airport Area (AAA) platform",
    region: "Schiphol corridor · NL",
    coordinates: [4.748, 52.315],
    mapZoom: 11,
    whatTheyDo:
      "Government-led, non-profit coordination platform introducing companies to land owners, developers and logistics partners in the airport economic zone.",
    evidence:
      "ISOCARP case study: AAA coordinates multi-entity development (Schiphol Group, municipalities, developers) — location matching as a shared service.",
    lessonForBerPlus:
      "BER+ Board Room as association-hosted matching — analogous role, smaller corridor, indicative OSM instead of cadastral GIS.",
    sourceUrl: "https://isocarp.org/app/uploads/2022/03/ISOCARP_2021_Han_367.pdf",
    sourceLabel: "ISOCARP 2021 — airport economic zone governance",
    programme: {
      horizon: "2010s–ongoing",
      phaseLabel: "Association-led location matching",
      milestones: [
        { label: "Multi-stakeholder governance model", status: "done" },
        { label: "Company ↔ land-owner introductions", status: "active" },
        { label: "Logistics partner network", status: "active" }
      ]
    },
    stakeholders: [
      { name: "AAA (Amsterdam Airport Area)", role: "Neutral coordination host" },
      { name: "Schiphol Group", role: "Airport & real estate" },
      { name: "Provincial & municipal agencies", role: "Planning alignment" },
      { name: "Private developers", role: "Plot supply & build-out" }
    ],
    matching: [
      { pattern: "Company → land owner / developer", scale: "Airport economic zone" },
      { pattern: "Logistics operator → corridor sites", scale: "Shared service model" }
    ]
  },
  {
    id: "avias-sites",
    category: "location-intelligence",
    name: "AVIAS™ SITES™ (airport land development)",
    region: "US airports · McFarland Johnson",
    coordinates: [-84.4281, 33.6407],
    mapZoom: 9,
    whatTheyDo:
      "GIS parcel map of aviation and non-aviation developable land, asset inventory, lease layers, financial scenarios per parcel.",
    evidence:
      "Auto-updated parcel map, marketing exports, highest-and-best-use analysis — standard pattern for airport real-estate teams.",
    lessonForBerPlus:
      "Our OSM Intel + BER+ land anchors = step-one visibility; verified member asset registry = step-two (Pilot-1 → inventory).",
    sourceUrl: "https://www.mjinfrasolutions.com/solutions/avias/sites",
    sourceLabel: "AVIAS SITES — land development GIS",
    dataNote: "Authoritative parcel GIS — BER+ prototype uses indicative OSM + curated anchors (disclaimer on map).",
    programme: {
      horizon: "Multi-year airport capital cycles",
      phaseLabel: "Parcel GIS as system of record",
      milestones: [
        { label: "Parcel & lease layer inventory", status: "done" },
        { label: "Highest-and-best-use scenarios", status: "active" },
        { label: "Marketing exports per parcel", status: "active" }
      ]
    },
    stakeholders: [
      { name: "Airport authority real-estate team", role: "Land inventory owner" },
      { name: "McFarland Johnson / AVIAS", role: "GIS platform vendor" },
      { name: "Airline & cargo tenants", role: "Lease stakeholders" },
      { name: "FAA / local planners", role: "Aviation constraints" }
    ],
    matching: [
      { pattern: "Developable parcel → tenant / use case", scale: "Per-parcel financial model" },
      { pattern: "Lease layer → marketing pipeline", scale: "Airport portfolio-wide" }
    ]
  },
  {
    id: "esri-airports",
    category: "location-intelligence",
    name: "Esri ArcGIS — airport planning & development",
    region: "Global · airport capital programmes",
    coordinates: [-117.1956, 34.0578],
    mapZoom: 8,
    whatTheyDo:
      "Single location-based system for land use, environmental constraints, infrastructure, hazards, BIM/CAD — shared view for all stakeholders.",
    evidence:
      "Feasibility, site selection, capital programme dashboards — GIS as system of record for airport-region development.",
    lessonForBerPlus:
      "Low-cost open path: OSM corridors + member links + programme timeline before a full enterprise GIS programme.",
    sourceUrl: "https://www.esri.com/en-us/industries/airports/business-areas/planning-design-development",
    sourceLabel: "Esri — airport planning & development",
    dataNote: "OpenStreetMap layers in our prototype are refreshed quarterly — not cadastral replacement.",
    programme: {
      horizon: "Enterprise GIS programmes (3–7 yr)",
      phaseLabel: "Capital programme & feasibility",
      milestones: [
        { label: "Constraints & environmental layers", status: "done" },
        { label: "BIM/CAD integration", status: "active" },
        { label: "Stakeholder dashboard rollout", status: "planned" }
      ]
    },
    stakeholders: [
      { name: "Airport capital programmes", role: "GIS programme owner" },
      { name: "Esri & integrators", role: "Platform & implementation" },
      { name: "Consultants & engineers", role: "Feasibility & design" },
      { name: "Regulators", role: "Environmental & safety data" }
    ],
    matching: [
      { pattern: "Site candidate → constraint stack", scale: "Portfolio-wide screening" },
      { pattern: "Capital milestone → stakeholder view", scale: "Programme dashboard" }
    ]
  },
  {
    id: "vlaio-geopunt",
    category: "invest-portal",
    name: "VLAIO + Geopunt (Flanders)",
    region: "Brussels Airport region · BE",
    coordinates: [4.4844, 50.9014],
    mapZoom: 10,
    whatTheyDo:
      "Invest agency maintains geographic inventory of industrial/logistics sites; Geopunt maps business centres; logistics hotspot maps include airports.",
    evidence:
      "Tailor-made location lists for foreign investors; Brucargo 109 ha logistics zone at Brussels Airport cited in invest materials.",
    lessonForBerPlus:
      "Combine invest narrative + map layers + member introductions — our Mitglieder graph and matching queue fill the same gap for BER+.",
    sourceUrl: "https://www.vlaio.be/en/guidance-advice/vlaio-supports-foreign-investors/finding-right-location",
    sourceLabel: "VLAIO — finding the right location",
    dataNote: "Multimodal logistics maps (ports, rail, airports) — comparable to our OSM transport + industry layers.",
    programme: {
      horizon: "2015–ongoing",
      phaseLabel: "Geo inventory + investor concierge",
      milestones: [
        { label: "Geopunt industrial site layers", status: "done" },
        { label: "Tailor-made location shortlists", status: "active" },
        { label: "Brucargo / airport cargo storytelling", status: "active" }
      ]
    },
    stakeholders: [
      { name: "VLAIO (Flanders Invest & Trade)", role: "Invest agency" },
      { name: "Geopunt (Flanders govt)", role: "Open geo platform" },
      { name: "Brussels Airport / Brucargo", role: "Cargo zone anchor" },
      { name: "Municipal economic dev.", role: "Local site supply" }
    ],
    matching: [
      { pattern: "Foreign investor → site shortlist", scale: "National geo inventory" },
      { pattern: "Sector team → logistics hotspot", scale: "Multimodal maps" }
    ]
  },
  {
    id: "invest-flanders-logistics",
    category: "invest-portal",
    name: "Invest in Flanders — logistics ecosystem",
    region: "Brussels · Ostend · Antwerp airports · BE",
    coordinates: [4.35, 51.05],
    mapZoom: 8,
    whatTheyDo:
      "Sector portal linking airport cargo zones, EDC density, and multimodal corridors for investor due diligence.",
    evidence: "~800 European Distribution Centres in Flanders; explicit airport cargo capacity figures in sector storytelling.",
    lessonForBerPlus:
      "Quantify corridor assets (developable ha, infra targets, member links) — our asset inventory summary is the start.",
    sourceUrl: "https://invest.flandersinvestmentandtrade.com/en/sectors/logistics-ecosystem",
    sourceLabel: "Invest in Flanders — logistics ecosystem",
    programme: {
      horizon: "Sector portal · continuous",
      phaseLabel: "Logistics ecosystem narrative",
      milestones: [
        { label: "~800 EDC density map", status: "done" },
        { label: "Airport cargo capacity figures", status: "active" },
        { label: "Multimodal corridor storytelling", status: "active" }
      ]
    },
    stakeholders: [
      { name: "Flanders Investment & Trade", role: "Sector portal host" },
      { name: "Brussels / Ostend / Antwerp airports", role: "Cargo nodes" },
      { name: "Port & rail operators", role: "Multimodal links" },
      { name: "EDC operators", role: "Tenant evidence" }
    ],
    matching: [
      { pattern: "Investor → EDC / logistics site", scale: "~800 EDC reference" },
      { pattern: "Cargo need → airport capacity", scale: "3 airport nodes" }
    ]
  },
  {
    id: "airport-dashboard-iai",
    category: "stakeholder-dashboard",
    name: "Airport Dashboard™ (Interactive Airport Intelligence)",
    region: "Airport operators · global",
    coordinates: [-97.0403, 32.8998],
    mapZoom: 9,
    whatTheyDo:
      "Customizable BI dashboards for airport management and local stakeholders — operations, passenger flows, revenue, collaboration.",
    evidence:
      "Explicitly designed for airport operators, retail, hotels, rental cars, convention bureaus — shared intelligence surface.",
    lessonForBerPlus:
      "BER+ Intelligence feed + Board Room map = lighter-weight regional variant for members and municipalities.",
    sourceUrl: "https://airportdashboard.com/",
    sourceLabel: "airportdashboard.com",
    programme: {
      horizon: "SaaS rollout per airport",
      phaseLabel: "Stakeholder BI surface",
      milestones: [
        { label: "Operations & passenger KPIs", status: "done" },
        { label: "Local stakeholder modules (retail, hotels)", status: "active" },
        { label: "Custom collaboration views", status: "planned" }
      ]
    },
    stakeholders: [
      { name: "Airport operator", role: "Dashboard owner" },
      { name: "Airport retailers & F&B", role: "Revenue stakeholders" },
      { name: "Hotels & rental cars", role: "Ground transport ecosystem" },
      { name: "Convention bureaus", role: "Regional economic impact" }
    ],
    matching: [
      { pattern: "KPI slice → stakeholder role", scale: "Role-based dashboards" },
      { pattern: "Passenger flow → retail/hotel planning", scale: "Collaboration surface" }
    ]
  },
  {
    id: "incheon-ifez",
    category: "airport-region",
    name: "Incheon IFEZ & Airport City",
    region: "Incheon · KR",
    coordinates: [126.451, 37.460],
    mapZoom: 10,
    whatTheyDo:
      "Free Economic Zone around Incheon International Airport — Songdo smart city, logistics hubs, and phased aerotropolis development with public masterplan.",
    evidence:
      "IFEZ authority coordinates foreign investment, airport-adjacent districts, and multimodal logistics — reference scale for airport-city governance.",
    lessonForBerPlus:
      "Shows what a long-horizon airport-city programme looks like; BER+ stays lean — corridor probe, not a 20-year masterplan IT stack.",
    sourceUrl: "https://www.ifez.go.kr/eng/",
    sourceLabel: "IFEZ — Incheon Free Economic Zone",
    programme: {
      horizon: "2003–2030+",
      phaseLabel: "Aerotropolis masterplan",
      milestones: [
        { label: "Songdo smart-city district", status: "done" },
        { label: "Logistics & FTZ clusters", status: "active" },
        { label: "Airport-adjacent commercial zones", status: "active" }
      ]
    },
    stakeholders: [
      { name: "IFEZ Authority", role: "Zone governance" },
      { name: "Incheon International Airport Corp.", role: "Airport operator" },
      { name: "Songdo developers", role: "District build-out" },
      { name: "Foreign investors (FTZ)", role: "Tenant pipeline" }
    ],
    matching: [
      { pattern: "Investor → FTZ / district zone", scale: "Multi-district masterplan" },
      { pattern: "Logistics operator → airport-adjacent hub", scale: "Multimodal Korea hub" }
    ]
  },
  {
    id: "changi-aerotropolis",
    category: "invest-portal",
    name: "Changi Aerotropolis & JTC estates",
    region: "Singapore · SG",
    coordinates: [103.9915, 1.3644],
    mapZoom: 11,
    whatTheyDo:
      "Changi Airport Group + JTC industrial estates — cargo, aerospace, and logistics zones mapped for investors with tight airport–port–city integration.",
    evidence:
      "Changi Airfreight Centre, aerospace parks, and JTC site finder — compact nation-scale invest + logistics map pattern.",
    lessonForBerPlus:
      "High-density logistics storytelling; our corridor OSM + member links mirror the same investor due-diligence need at BER scale.",
    sourceUrl: "https://www.jtc.gov.sg/",
    sourceLabel: "JTC — Singapore industrial estates",
    programme: {
      horizon: "2000s–ongoing",
      phaseLabel: "Airport–industry integration",
      milestones: [
        { label: "Changi Airfreight Centre", status: "done" },
        { label: "Aerospace & logistics parks (JTC)", status: "active" },
        { label: "Site finder for foreign investors", status: "active" }
      ]
    },
    stakeholders: [
      { name: "Changi Airport Group", role: "Airport & cargo" },
      { name: "JTC Corporation", role: "Industrial estate developer" },
      { name: "EDB Singapore", role: "Invest agency" },
      { name: "Aerospace & logistics tenants", role: "Sector anchors" }
    ],
    matching: [
      { pattern: "Investor → JTC plot / estate", scale: "National site finder" },
      { pattern: "Cargo need → airfreight centre capacity", scale: "Airport-integrated" }
    ]
  },
  {
    id: "dubai-south-dwc",
    category: "airport-region",
    name: "Dubai South (DWC aerotropolis)",
    region: "Dubai World Central · AE",
    coordinates: [55.154, 24.896],
    mapZoom: 10,
    whatTheyDo:
      "Master-planned aerotropolis around Al Maktoum International (DWC) — logistics, aviation, residential and expo legacy districts on a single development map.",
    evidence:
      "Dubai South authority markets multi-phase districts with explicit logistics and aviation clusters — global reference for greenfield airport cities.",
    lessonForBerPlus:
      "Greenfield aerotropolis marketing; BER+ focuses on brownfield corridor coordination where members already hold assets.",
    sourceUrl: "https://www.dubaisouth.ae/",
    sourceLabel: "Dubai South",
    programme: {
      horizon: "2006–2040+",
      phaseLabel: "Greenfield aerotropolis",
      milestones: [
        { label: "Al Maktoum International (DWC) open", status: "done" },
        { label: "Logistics & aviation districts", status: "active" },
        { label: "Expo legacy & residential phases", status: "active" }
      ]
    },
    stakeholders: [
      { name: "Dubai South", role: "Master developer" },
      { name: "DCAA / airport operator", role: "Aviation" },
      { name: "Logistics & aviation investors", role: "District tenants" },
      { name: "Expo legacy entities", role: "Mixed-use districts" }
    ],
    matching: [
      { pattern: "Investor → district / plot typology", scale: "Multi-district map" },
      { pattern: "Aviation operator → logistics cluster", scale: "Aerotropolis zones" }
    ]
  },
  {
    id: "ber-osm-prototype",
    category: "location-intelligence",
    name: "BER+ Board Room (this prototype)",
    region: "Schönefeld corridor · DE",
    coordinates: [13.5225, 52.3667],
    mapZoom: 10.4,
    whatTheyDo:
      "Open OSM land/infra layers, 14 Mitglieder, matching graph, programme timeline, intelligence RSS — hosted by BER+.",
    evidence:
      "Live at ber-war-map.vercel.app; SEGRO Pilot-1 anchor; indicative layers with sources on each feature popup.",
    lessonForBerPlus:
      "Practical 12–24 month probe — not a multi-year IT programme; pilot members validate links before scale.",
    sourceUrl: "https://ber-war-map.vercel.app/",
    sourceLabel: "ber-war-map.vercel.app",
    dataNote: "OSM via /api/osm/schoenefeld — quarterly refresh proposed; cadastral detail stays with authorities.",
    programme: {
      horizon: "2026–2036 (Pilot-1 → scale)",
      phaseLabel: "Phase I — Validate (Pilot-1)",
      milestones: [
        { label: "Board Room map + 14 Mitglieder", status: "done" },
        { label: "OSM Intel + matching graph", status: "active" },
        { label: "Pilot-1 financial close", status: "planned", date: "2028" }
      ]
    },
    stakeholders: [
      { name: "IG Umfeld BER e.V. (BER+)", role: "Association host" },
      { name: "14 Mitglieder", role: "Developers, investors, infra" },
      { name: "SEGRO", role: "Pilot-1 anchor" },
      { name: "Municipalities & FBB", role: "Public corridor context" }
    ],
    matching: [
      { pattern: "Mitglied → OSM land / infra feature", scale: "Corridor graph" },
      { pattern: "Investor / company → member introduction", scale: "Pass / Save queue" },
      { pattern: "Programme milestone → corridor asset", scale: "Timeline + Pilot-1" }
    ]
  }
];

export type OsmBbox = { south: number; west: number; north: number; east: number };

/** Airport-region intel slice around benchmark anchor */
export function benchmarkOsmBbox(b: Benchmark): OsmBbox {
  const [lng, lat] = b.coordinates;
  const dLng = b.id === "ber-osm-prototype" ? 0.1 : 0.09;
  const dLat = b.id === "ber-osm-prototype" ? 0.05 : 0.065;
  return { south: lat - dLat, west: lng - dLng, north: lat + dLat, east: lng + dLng };
}

export function getBenchmarkById(id: string): Benchmark | undefined {
  return BENCHMARKS.find((b) => b.id === id);
}

/** Instructor final-push checklist mapped to in-app experience */
export const PITCH_READINESS = [
  {
    id: "visualize",
    label: "Visualize more",
    detail: "Walk company · investor · municipality demos on the map — not text-only slides.",
    inApp: "Persona chips → live map + matching + global benchmarks"
  },
  {
    id: "evidence",
    label: "Use evidence",
    detail: "Benchmarks below with sources; OSM tags on popups; Pilot-1 on programme timeline.",
    inApp: "Benchmarks panel · Global map · OSM Intel · Briefing"
  },
  {
    id: "team",
    label: "Introduce the team",
    detail: "Open with who built the probe and which corridor slice you own.",
    inApp: "Session picker · BER+ Flughafenregion framing"
  },
  {
    id: "rehearse",
    label: "Practice the pitch",
    detail: "One full run: problem → benchmarks → 3 demos → what BER+ does next.",
    inApp: "Overview tab walkthrough + Pass/Save on matching map"
  }
] as const;
