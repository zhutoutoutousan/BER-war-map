import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";

const RAW_OSM_REF = /^(node|way|relation)\/\d+$/i;

/** True when the string is only an OSM element ref, not a human label. */
export function isRawOsmRef(value: string | undefined | null): boolean {
  return Boolean(value && RAW_OSM_REF.test(value.trim()));
}

const LANDUSE_LABELS: Record<string, string> = {
  construction: "Construction site",
  brownfield: "Brownfield parcel",
  greenfield: "Greenfield parcel",
  industrial: "Industrial land",
  commercial: "Commercial land",
  retail: "Retail land",
  residential: "Residential land",
  farmland: "Farmland",
  meadow: "Meadow",
  forest: "Forest",
  grass: "Grassland"
};

const BUILDING_LABELS: Record<string, string> = {
  industrial: "Industrial building",
  warehouse: "Warehouse",
  commercial: "Commercial building",
  office: "Office building",
  retail: "Retail building",
  yes: "Building"
};

/** Human-readable title when OSM has no name/ref/operator tag. */
export function humanizeOsmTags(
  tags: Record<string, string>,
  category?: string,
  subcategory?: string
): string | null {
  const landuse = tags.landuse;
  if (landuse && LANDUSE_LABELS[landuse]) return LANDUSE_LABELS[landuse];

  const building = tags.building;
  if (building && BUILDING_LABELS[building]) return BUILDING_LABELS[building];

  if (category === "land" && subcategory) {
    const sub = LANDUSE_LABELS[subcategory];
    if (sub) return sub;
    return `Land · ${subcategory.replace(/_/g, " ")}`;
  }

  if (category === "industry") {
    return subcategory && subcategory !== "unknown"
      ? `Industry · ${subcategory.replace(/_/g, " ")}`
      : "Industry zone";
  }

  if (category === "power" && subcategory) return `Power · ${subcategory}`;
  if (category === "transport" && subcategory) {
    const part = subcategory.split(":").pop() ?? subcategory;
    return `Transport · ${part.replace(/_/g, " ")}`;
  }

  if (category === "aeroway" && subcategory) {
    return `Airport · ${subcategory.replace(/_/g, " ")}`;
  }

  if (tags.man_made) return `Infrastructure · ${tags.man_made.replace(/_/g, " ")}`;

  return null;
}

type NameInput = {
  name?: string;
  id?: string;
  category?: string;
  subcategory?: string;
  tagsSummary?: string;
  osmType?: string;
  osmId?: string | number;
  tags?: Record<string, string>;
};

/** Best display name for UI (graph label, match review, popups). */
export function displayNameForOsmFeature(input: NameInput): string {
  const name = input.name?.trim();
  if (name && !isRawOsmRef(name)) return name;

  const tags = input.tags ?? tagsFromSummary(input.tagsSummary);
  const human = humanizeOsmTags(tags, input.category, input.subcategory);
  if (human) return human;

  if (input.category && input.subcategory) {
    const sub = input.subcategory.replace(/^(land|rail|road):/, "").replace(/_/g, " ");
    return `${input.category} · ${sub}`;
  }

  if (input.osmType && input.osmId != null) return `${input.osmType} ${input.osmId}`;
  if (input.id && !isRawOsmRef(input.id)) return input.id;
  return "Unnamed corridor asset";
}

function tagsFromSummary(summary?: string): Record<string, string> {
  const tags: Record<string, string> = {};
  if (!summary) return tags;
  for (const part of summary.split(" · ")) {
    const eq = part.indexOf("=");
    if (eq > 0) tags[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return tags;
}
