/**
 * BER+ corridor land research — curated from public BER+/SEGRO/FBB narrative.
 * OSM polygons are cross-checked against these anchors; not a substitute for cadastral data.
 */

export type BerLandSiteStatus = "confirmed" | "planned" | "candidate" | "osm-indicative";

export type BerLandSite = {
  id: string;
  name: string;
  nameDe: string;
  status: BerLandSiteStatus;
  /** Approximate area (hectares) from project docs / press */
  areaHa: number;
  /** Label / map focus centre */
  coordinates: [number, number];
  /** Optional indicative zone polygon [lng, lat] — otherwise derived from areaHa */
  footprint?: [number, number][];
  useCase: string;
  berPlusRole: string;
  notes: string;
  sources?: string[];
};

export function getBerLandSiteById(id: string): BerLandSite | undefined {
  return BER_LAND_SITES.find((s) => s.id === id);
}

export const BER_LAND_SITES: BerLandSite[] = [
  {
    id: "pilot-1-segro",
    name: "Pilot-1 — SEGRO North Cargo Micro-Hub",
    nameDe: "Pilot-1 — SEGRO North Cargo Micro-Hub",
    status: "confirmed",
    areaHa: 2.0,
    coordinates: [13.503, 52.375],
    footprint: [
      [13.498, 52.372],
      [13.508, 52.372],
      [13.508, 52.378],
      [13.498, 52.378]
    ],
    useCase: "PV + BESS + EWF demo · microgrid",
    berPlusRole: "Anchor Pilot-1 site between SEGRO Park & BER North Cargo",
    notes:
      "BER+ Module 1.0 reference implementation. Rooftop PV, container BESS, water/vertical-farm EWF stack. Requires SEGRO lease + FBB PPA.",
    sources: ["BER+ briefing", "SEGRO Park Berlin Airport"]
  },
  {
    id: "segro-park",
    name: "SEGRO Park Berlin Airport",
    nameDe: "SEGRO Park Berlin Airport / Logistikpark Schönefeld",
    status: "confirmed",
    areaHa: 120,
    coordinates: [13.49, 52.37],
    footprint: [
      [13.455, 52.358],
      [13.525, 52.358],
      [13.525, 52.382],
      [13.455, 52.382]
    ],
    useCase: "Logistics roofs · tenant load · replication plots",
    berPlusRole: "Primary land/roof partner — expansion beyond Pilot-1 parcel",
    notes:
      "Large logistics/light-industrial park adjacent to BER. OSM shows industrial landuse; BER+ targets unbuilt roofs and spare plots inside park fence.",
    sources: ["segro.com — SEGRO Park Berlin Airport"]
  },
  {
    id: "schoenefeld-nord",
    name: "Schönefeld Nord — Quartiersentwicklung",
    nameDe: "Schönefeld Nord",
    status: "planned",
    areaHa: 45,
    coordinates: [13.52, 52.395],
    footprint: [
      [13.505, 52.388],
      [13.535, 52.388],
      [13.535, 52.402],
      [13.505, 52.402]
    ],
    useCase: "District energy · Wärmenetz · resilience spine",
    berPlusRole: "Masterplan dialogue — BUWOG / municipality (not single free plot)",
    notes:
      "Mixed residential/industrial transition zone north of town. BER+ positions corridor microgrid and EWF as quartier infrastructure, not greenfield takeover.",
    sources: ["BUWOG NEUE MITTE", "BER+ Mitglieder"]
  },
  {
    id: "neue-mitte",
    name: "Neue Mitte Schönefeld",
    nameDe: "Neue Mitte Schönefeld",
    status: "planned",
    areaHa: 25,
    coordinates: [13.515, 52.385],
    useCase: "Urban quarter · building-integrated PV",
    berPlusRole: "Community / housing energy integration",
    notes: "Town-centre expansion; synergy with airport-region housing demand. Grid connection still constrained regionally.",
    sources: ["BUWOG", "ber-plus.de"]
  },
  {
    id: "wassmannsdorf-gewerbe",
    name: "Waßmannsdorf — Gewerbe / Logistik belt",
    nameDe: "Waßmannsdorf Gewerbegebiet",
    status: "candidate",
    areaHa: 30,
    coordinates: [13.55, 52.365],
    useCase: "Logistics · light industry · Pilot-N replication",
    berPlusRole: "Corridor scale-out east of BER",
    notes: "Industrial belt on A113 approach; OSM industrial polygons common. Verify ownership and B-Plan before any Pilot-N.",
    sources: ["OSM landuse=industrial", "BER+ corridor"]
  },
  {
    id: "horizn-ber",
    name: "HORIZN BER / Airport City fringe",
    nameDe: "HORIZN BER",
    status: "candidate",
    areaHa: 15,
    coordinates: [13.51, 52.362],
    useCase: "Airport-city commercial · rooftop PV",
    berPlusRole: "High-visibility airport-adjacent demand anchor",
    notes: "Airport commercial development; FBB ecosystem. Better suited to PPA/roof than greenfield micro-hub.",
    sources: ["BER+ keywords", "FBB"]
  },
  {
    id: "mellensee-south",
    name: "Mellensee — south logistics fringe",
    nameDe: "Mellensee Logistik",
    status: "osm-indicative",
    areaHa: 20,
    coordinates: [13.58, 52.35],
    useCase: "Corridor extension · warehouse PV",
    berPlusRole: "Phase II replication corridor (draft)",
    notes: "Further from BER; check OSM meadow/farmland vs occupied logistics in Overpass output.",
    sources: ["OSM", "BER+ Phase II narrative"]
  }
];
