import type { OsmIntelCategory } from "@/lib/osm-intel-categories";
import { OSM_INTEL_CATEGORY_COLORS } from "@/lib/osm-intel-categories";
import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";

/** Infrastructure categories that get map icons (not land parcels). */
export const INFRASTRUCTURE_CATEGORIES = new Set<OsmIntelCategory>([
  "aeroway",
  "industry",
  "power",
  "transport",
  "utilities"
]);

/** Drawn as line layers only — no midpoint map icons */
export const LINE_ONLY_ICON_KEYS = new Set<InfraIconKey>([
  "power-line",
  "rail",
  "motorway",
  "road",
  "pipeline"
]);

export type InfraIconKey =
  | "airport"
  | "runway"
  | "industry"
  | "logistics"
  | "substation"
  | "power-line"
  | "rail"
  | "motorway"
  | "road"
  | "water"
  | "pipeline"
  | "generic";

export type InfraIconDef = {
  key: InfraIconKey;
  glyph: string;
  labelEn: string;
  color: string;
  lineOnly?: boolean;
};

export const INFRA_ICON_DEFS: InfraIconDef[] = [
  { key: "airport", glyph: "✈", labelEn: "Airport", color: "#7dd3fc" },
  { key: "runway", glyph: "🛫", labelEn: "Runway", color: "#38bdf8" },
  { key: "industry", glyph: "🏭", labelEn: "Industry", color: "#fcd34d" },
  { key: "logistics", glyph: "📦", labelEn: "Logistics", color: "#fbbf24" },
  { key: "substation", glyph: "⚡", labelEn: "Substation", color: "#fca5a5" },
  { key: "power-line", glyph: "—", labelEn: "Power line", color: "#f87171", lineOnly: true },
  { key: "rail", glyph: "—", labelEn: "Rail", color: "#bef264", lineOnly: true },
  { key: "motorway", glyph: "—", labelEn: "Motorway", color: "#a3e635", lineOnly: true },
  { key: "road", glyph: "—", labelEn: "Road", color: "#84cc16", lineOnly: true },
  { key: "water", glyph: "💧", labelEn: "Water works", color: "#67e8f9" },
  { key: "pipeline", glyph: "—", labelEn: "Pipeline", color: "#22d3ee", lineOnly: true },
  { key: "generic", glyph: "◆", labelEn: "Facility", color: "#cbd5e1" }
];

/** Point / polygon markers only (excludes corridor line types) */
export const INFRA_POINT_ICON_DEFS = INFRA_ICON_DEFS.filter((d) => !d.lineOnly);

const GLYPH_BY_KEY = Object.fromEntries(INFRA_ICON_DEFS.map((d) => [d.key, d.glyph])) as Record<
  InfraIconKey,
  string
>;

const COLOR_BY_KEY = Object.fromEntries(INFRA_ICON_DEFS.map((d) => [d.key, d.color])) as Record<
  InfraIconKey,
  string
>;

export function infraIconGlyph(key: InfraIconKey): string {
  return GLYPH_BY_KEY[key] ?? "◆";
}

export function infraIconColor(key: InfraIconKey, category: OsmIntelCategory): string {
  return COLOR_BY_KEY[key] ?? OSM_INTEL_CATEGORY_COLORS[category];
}

function isNamedFeature(name: string): boolean {
  return name.length > 2 && !/^(way|node|relation)\//.test(name);
}

/** Reduce map clutter — aeroway/industry polygons rely on fill layers instead */
export function shouldShowMapIcon(
  props: OsmIntelFeatureProperties,
  iconKey: InfraIconKey,
  geomType: string
): boolean {
  if (LINE_ONLY_ICON_KEYS.has(iconKey)) return false;

  if (props.category === "aeroway") {
    if (geomType === "polygon") return false;
    if (iconKey === "runway") return false;
    return props.berRelevant || isNamedFeature(props.name);
  }

  if (props.category === "industry" && geomType === "polygon") {
    return props.memberLinked || props.berRelevant || (props.areaHa ?? 0) >= 4;
  }

  if (props.category === "utilities" && geomType === "polygon") {
    return props.memberLinked || props.berRelevant || isNamedFeature(props.name);
  }

  return true;
}

export function resolveInfraIconKey(
  category: OsmIntelCategory,
  subcategory: string,
  tags: Record<string, string> = {}
): InfraIconKey {
  if (category === "aeroway") {
    if (/runway|taxiway|parking_position/i.test(subcategory)) return "runway";
    return "airport";
  }
  if (category === "industry") {
    if (tags.landuse === "logistics" || subcategory === "logistics") return "logistics";
    return "industry";
  }
  if (category === "power") {
    if (subcategory === "line" || subcategory === "minor_line" || subcategory === "cable") return "power-line";
    return "substation";
  }
  if (category === "transport") {
    if (subcategory.startsWith("rail:")) return "rail";
    if (subcategory === "road:motorway" || subcategory === "road:trunk") return "motorway";
    if (subcategory.startsWith("road:")) return "road";
    return "road";
  }
  if (category === "utilities") {
    if (tags.man_made === "pipeline" || subcategory === "pipeline") return "pipeline";
    return "water";
  }
  return "generic";
}

function centroidOf(geom: GeoJSON.Geometry): [number, number] | null {
  if (geom.type === "Point") return geom.coordinates as [number, number];
  const ring =
    geom.type === "Polygon"
      ? geom.coordinates[0]
      : geom.type === "LineString"
        ? geom.coordinates
        : null;
  if (!ring?.length) return null;
  let lng = 0;
  let lat = 0;
  for (const c of ring) {
    lng += c[0];
    lat += c[1];
  }
  return [lng / ring.length, lat / ring.length];
}

export type InfraIconPointProperties = {
  id: string;
  category: OsmIntelCategory;
  iconKey: InfraIconKey;
  iconGlyph: string;
  iconColor: string;
  name: string;
  berRelevant: boolean;
  memberLinked: boolean;
  memberLabels: string;
};

/** Point markers for polygons & nodes — lines stay on line layers only */
export function buildInfraIconGeoJSON(
  features: GeoJSON.Feature[]
): GeoJSON.FeatureCollection<GeoJSON.Point, InfraIconPointProperties> {
  const out: GeoJSON.Feature<GeoJSON.Point, InfraIconPointProperties>[] = [];
  const seen = new Set<string>();

  const push = (
    id: string,
    coord: [number, number],
    props: OsmIntelFeatureProperties,
    iconKey: InfraIconKey
  ) => {
    if (!INFRASTRUCTURE_CATEGORIES.has(props.category)) return;
    if (LINE_ONLY_ICON_KEYS.has(iconKey)) return;

    const key = `${id}@${coord[0].toFixed(5)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      type: "Feature",
      id: `icon/${id}`,
      geometry: { type: "Point", coordinates: coord },
      properties: {
        id: props.id,
        category: props.category,
        iconKey,
        iconGlyph: GLYPH_BY_KEY[iconKey],
        iconColor: infraIconColor(iconKey, props.category),
        name: props.name,
        berRelevant: props.berRelevant,
        memberLinked: props.memberLinked,
        memberLabels: props.memberLabels
      }
    });
  };

  for (const f of features) {
    const props = f.properties as OsmIntelFeatureProperties | undefined;
    if (!props?.id || props.category === "land") continue;

    const iconKey = props.iconKey ?? resolveInfraIconKey(props.category, props.subcategory);
    const geomType =
      f.geometry.type === "Point" ? "point" : f.geometry.type === "Polygon" ? "polygon" : "line";

    if (!shouldShowMapIcon(props, iconKey, geomType)) continue;

    if (f.geometry.type === "Point") {
      push(props.id, f.geometry.coordinates as [number, number], props, iconKey);
      continue;
    }

    if (f.geometry.type === "Polygon") {
      const c = centroidOf(f.geometry);
      if (c) push(props.id, c, props, iconKey);
    }
  }

  return { type: "FeatureCollection", features: out };
}
