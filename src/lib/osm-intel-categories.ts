/** OSM layers — Schönefeld / BER+ infrastructure & land */

export type OsmIntelCategory = "land" | "aeroway" | "industry" | "power" | "transport" | "utilities";

export type OsmIntelCategoryMeta = {
  id: OsmIntelCategory;
  labelEn: string;
  labelDe: string;
  color: string;
  mapLayerId: string;
};

export const OSM_INTEL_CATEGORIES: OsmIntelCategoryMeta[] = [
  {
    id: "land",
    labelEn: "Land parcels",
    labelDe: "Freiflächen / Potenzial",
    color: "#34d399",
    mapLayerId: "osm-intel-land"
  },
  {
    id: "aeroway",
    labelEn: "Airport / aeroway",
    labelDe: "Flughafen / Aeroway",
    color: "#38bdf8",
    mapLayerId: "osm-intel-aeroway"
  },
  {
    id: "industry",
    labelEn: "Industry zones",
    labelDe: "Gewerbe / Industrie",
    color: "#f59e0b",
    mapLayerId: "osm-intel-industry"
  },
  {
    id: "power",
    labelEn: "Power grid",
    labelDe: "Strom / Netz",
    color: "#f87171",
    mapLayerId: "osm-intel-power"
  },
  {
    id: "transport",
    labelEn: "Transport",
    labelDe: "Verkehr",
    color: "#a3e635",
    mapLayerId: "osm-intel-transport"
  },
  {
    id: "utilities",
    labelEn: "Utilities",
    labelDe: "Versorgung",
    color: "#22d3ee",
    mapLayerId: "osm-intel-utilities"
  }
];

export const OSM_INTEL_CATEGORY_COLORS = Object.fromEntries(
  OSM_INTEL_CATEGORIES.map((c) => [c.id, c.color])
) as Record<OsmIntelCategory, string>;

export const LAND_OPPORTUNITY_LABELS: Record<string, { en: string; de: string }> = {
  "pilot-anchor": { en: "BER+ anchor", de: "BER+ Anker" },
  developable: { en: "Developable", de: "Entwickelbar" },
  potential: { en: "Potential", de: "Potenzial" },
  expansion: { en: "Expansion / rooftop", de: "Erweiterung/Dach" },
  occupied: { en: "Occupied", de: "Belegt" }
};
