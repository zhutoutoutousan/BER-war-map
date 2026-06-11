import { scoreBerRelevance } from "@/lib/ber-topics";
import { BER_LAND_SITES } from "@/data/ber-land-sites";
import type { BerLandSite } from "@/data/ber-land-sites";
import type { OsmIntelCategory } from "@/lib/osm-intel-categories";
import {
  classifyLandOpportunity,
  polygonAreaHa,
  rankLandParcels,
  type LandOpportunity
} from "@/lib/osm-land-analysis";
import { humanizeOsmTags } from "@/lib/osm-display-name";
import {
  buildInfraIconGeoJSON,
  infraIconGlyph,
  resolveInfraIconKey,
  type InfraIconKey
} from "@/lib/osm-infra-icons";
import { countMemberOsmLinks, matchOsmToMembers } from "@/lib/member-osm-links";

/** Schönefeld town + BER airport apron / cargo belt */
export const SCHOENEFELD_OSM_BBOX = {
  south: 52.32,
  west: 13.42,
  north: 52.42,
  east: 13.62
};

export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"
] as const;

export type OsmBbox = { south: number; west: number; north: number; east: number };

export function buildOverpassQuery(bbox: OsmBbox, timeoutSec = 90): string {
  const B = bbox;
  return `[out:json][timeout:${timeoutSec}];
(
  way["landuse"~"industrial|commercial|retail|logistics|greenfield|brownfield|construction|meadow|farmland|grass|orchard"](${B.south},${B.west},${B.north},${B.east});
  way["aeroway"](${B.south},${B.west},${B.north},${B.east});
  node["aeroway"](${B.south},${B.west},${B.north},${B.east});
  node["power"~"substation|plant|generator|transformer"](${B.south},${B.west},${B.north},${B.east});
  way["power"~"line|minor_line|cable"](${B.south},${B.west},${B.north},${B.east});
  way["railway"](${B.south},${B.west},${B.north},${B.east});
  way["highway"~"motorway|trunk|primary|secondary|tertiary"](${B.south},${B.west},${B.north},${B.east});
  node["man_made"~"works|wastewater_plant|water_works|storage_tank"](${B.south},${B.west},${B.north},${B.east});
  way["man_made"="pipeline"](${B.south},${B.west},${B.north},${B.east});
  way["building"="industrial"](${B.south},${B.west},${B.north},${B.east});
);
out geom;`;
}

export const SCHOENEFELD_OVERPASS_QUERY = buildOverpassQuery(SCHOENEFELD_OSM_BBOX, 120);

export type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  geometry?: { lat: number; lon: number }[];
};

export type OsmGeomType = "polygon" | "line" | "point";

export type OsmIntelFeatureProperties = {
  id: string;
  osmType: string;
  osmId: number;
  name: string;
  category: OsmIntelCategory;
  subcategory: string;
  geomType: OsmGeomType;
  iconKey: InfraIconKey;
  berScore: number;
  berRelevant: boolean;
  tagsSummary: string;
  areaHa?: number;
  landOpportunity?: LandOpportunity;
  landSuitability?: number;
  landNotes?: string;
  memberLinked: boolean;
  memberIds: string;
  memberLabels: string;
  primaryMemberId: string;
  memberMatchKinds: string;
};

function geomTypeOf(geometry: GeoJSON.Geometry): OsmGeomType {
  if (geometry.type === "Point") return "point";
  if (geometry.type === "LineString") return "line";
  return "polygon";
}

export type OsmLandParcel = {
  id: string;
  name: string;
  areaHa: number;
  opportunity: LandOpportunity;
  suitability: number;
  landuse: string;
  notes: string;
  coordinates: [number, number];
  berScore: number;
};

export type OsmIntelDossierItem = {
  id: string;
  name: string;
  category: OsmIntelCategory;
  subcategory: string;
  iconKey: InfraIconKey;
  iconGlyph: string;
  berScore: number;
  memberLabels: string;
  geomType: "polygon" | "line" | "point";
  coordinates: [number, number];
};

export type OsmIntelSummary = {
  total: number;
  byCategory: Record<OsmIntelCategory, number>;
  berRelevantCount: number;
  topTargets: OsmIntelDossierItem[];
  infrastructure: OsmIntelDossierItem[];
  landParcels: OsmLandParcel[];
  developableHa: number;
  infrastructureNote: string;
  memberLinkCounts: Record<string, number>;
  memberLinkedTotal: number;
};

export type OsmIntelPayload = {
  geojson: GeoJSON.FeatureCollection;
  iconGeojson: GeoJSON.FeatureCollection<GeoJSON.Point>;
  summary: OsmIntelSummary;
  curatedSites: BerLandSite[];
  fetchedAt: string;
  bbox: typeof SCHOENEFELD_OSM_BBOX;
  attribution: string;
};

export function emptyOsmIntelPayload(bbox: OsmBbox, regionLabel: string): OsmIntelPayload {
  const emptySummary: OsmIntelSummary = {
    total: 0,
    byCategory: { land: 0, aeroway: 0, industry: 0, power: 0, transport: 0, utilities: 0 },
    berRelevantCount: 0,
    topTargets: [],
    infrastructure: [],
    landParcels: [],
    developableHa: 0,
    infrastructureNote: `${regionLabel}: OSM fetch unavailable — try again shortly.`,
    memberLinkCounts: {},
    memberLinkedTotal: 0
  };
  return {
    geojson: { type: "FeatureCollection", features: [] },
    iconGeojson: { type: "FeatureCollection", features: [] },
    summary: emptySummary,
    curatedSites: [],
    fetchedAt: new Date().toISOString(),
    bbox,
    attribution: "© OpenStreetMap contributors · Overpass API · indicative only (not cadastral)"
  };
}

const OCCUPIED_LANDUSE = new Set(["industrial", "commercial", "retail", "logistics", "railway"]);

const LANDUSE_CATEGORIES: Record<string, OsmIntelCategory> = {
  greenfield: "land",
  brownfield: "land",
  construction: "land",
  meadow: "land",
  farmland: "land",
  grass: "land",
  orchard: "land",
  industrial: "industry",
  commercial: "industry",
  retail: "industry",
  logistics: "industry"
};

function categorize(tags: Record<string, string>): { category: OsmIntelCategory; subcategory: string } {
  if (tags.building === "industrial") return { category: "industry", subcategory: "building:industrial" };
  if (tags.aeroway) return { category: "aeroway", subcategory: tags.aeroway };
  if (tags.power) return { category: "power", subcategory: tags.power };
  if (tags.railway) return { category: "transport", subcategory: `rail:${tags.railway}` };
  if (tags.highway) return { category: "transport", subcategory: `road:${tags.highway}` };
  if (tags.man_made) return { category: "utilities", subcategory: tags.man_made };
  if (tags.landuse) {
    const cat = LANDUSE_CATEGORIES[tags.landuse] ?? "land";
    return { category: cat, subcategory: tags.landuse };
  }
  return { category: "industry", subcategory: "unknown" };
}

function featureName(
  tags: Record<string, string>,
  fallback: string,
  category: string,
  subcategory: string
) {
  const raw = tags.name ?? tags["name:de"] ?? tags.ref ?? tags.operator;
  if (raw?.trim()) return raw.trim();
  return humanizeOsmTags(tags, category, subcategory) ?? fallback;
}

function tagsSummary(tags: Record<string, string>) {
  const keys = ["landuse", "aeroway", "power", "railway", "highway", "man_made", "operator", "voltage", "building"];
  return keys
    .filter((k) => tags[k])
    .map((k) => `${k}=${tags[k]}`)
    .slice(0, 4)
    .join(" · ");
}

function wayToGeometry(geometry: { lat: number; lon: number }[]): GeoJSON.Geometry | null {
  if (!geometry?.length) return null;
  const coords = geometry.map((p) => [p.lon, p.lat] as [number, number]);
  const closed =
    coords.length > 3 &&
    coords[0][0] === coords[coords.length - 1][0] &&
    coords[0][1] === coords[coords.length - 1][1];
  if (closed && coords.length >= 4) {
    return { type: "Polygon", coordinates: [coords] };
  }
  return { type: "LineString", coordinates: coords };
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

export type OsmIntelBuildOptions = {
  bbox?: OsmBbox;
  regionLabel?: string;
  curatedSites?: BerLandSite[];
};

export function osmElementsToIntel(
  elements: OsmElement[],
  opts: OsmIntelBuildOptions = {}
): OsmIntelPayload {
  const bbox = opts.bbox ?? SCHOENEFELD_OSM_BBOX;
  const regionLabel = opts.regionLabel ?? "Schönefeld corridor";
  const curatedSites = opts.curatedSites ?? BER_LAND_SITES;
  const features: GeoJSON.Feature[] = [];
  const dossier: OsmIntelDossierItem[] = [];
  const landParcels: OsmLandParcel[] = [];
  const byCategory: Record<OsmIntelCategory, number> = {
    land: 0,
    aeroway: 0,
    industry: 0,
    power: 0,
    transport: 0,
    utilities: 0
  };
  let berRelevantCount = 0;

  for (const el of elements) {
    const tags = el.tags ?? {};
    const { category, subcategory } = categorize(tags);
    const name = featureName(tags, `${el.type}/${el.id}`, category, subcategory);
    const textForScore = `${name} ${tagsSummary(tags)} ${Object.values(tags).join(" ")}`;
    const berScore = scoreBerRelevance(textForScore);
    const berRelevant = berScore >= 2;

    let geometry: GeoJSON.Geometry | null = null;
    if (el.type === "node" && el.lat != null && el.lon != null) {
      if (tags.power === "substation" || tags.power === "plant") {
        const d = 0.0004;
        const lng = el.lon;
        const lat = el.lat;
        geometry = {
          type: "Polygon",
          coordinates: [
            [
              [lng - d, lat - d],
              [lng + d, lat - d],
              [lng + d, lat + d],
              [lng - d, lat + d],
              [lng - d, lat - d]
            ]
          ]
        };
      } else {
        geometry = { type: "Point", coordinates: [el.lon, el.lat] };
      }
    } else if (el.geometry) {
      geometry = wayToGeometry(el.geometry);
    }
    if (!geometry) continue;

    if (category === "power" && geometry.type === "LineString" && geometry.coordinates.length > 60) {
      continue;
    }

    const id = `${el.type}/${el.id}`;
    const center = centroidOf(geometry);

    let areaHa: number | undefined;
    let landOpportunity: LandOpportunity | undefined;
    let landSuitability: number | undefined;
    let landNotes: string | undefined;

    if (geometry.type === "Polygon" && center) {
      areaHa = Math.round(polygonAreaHa(geometry.coordinates[0] as [number, number][]) * 100) / 100;
      if (category === "land" || tags.landuse) {
        const land = classifyLandOpportunity(tags, areaHa, name, center);
        landOpportunity = land.opportunity;
        landSuitability = land.suitability;
        landNotes = land.notes;
        if (areaHa >= 0.3 && land.opportunity !== "occupied") {
          landParcels.push({
            id,
            name,
            areaHa,
            opportunity: land.opportunity,
            suitability: land.suitability,
            landuse: tags.landuse ?? subcategory,
            notes: land.notes,
            coordinates: center,
            berScore
          });
        }
      } else if (tags.landuse && OCCUPIED_LANDUSE.has(tags.landuse)) {
        landOpportunity = "expansion";
        landSuitability = 45;
        landNotes = "Occupied gewerbe — rooftop / tenant load, not vacant";
      }
    }

    const iconKey = resolveInfraIconKey(category, subcategory, tags);
    const memberMatch = matchOsmToMembers({
      name,
      tags,
      category,
      subcategory,
      center
    });

    const props: OsmIntelFeatureProperties = {
      id,
      osmType: el.type,
      osmId: el.id,
      name,
      category,
      subcategory,
      geomType: geomTypeOf(geometry),
      iconKey,
      berScore,
      berRelevant,
      tagsSummary: tagsSummary(tags),
      areaHa,
      landOpportunity,
      landSuitability,
      landNotes,
      memberLinked: memberMatch.memberLinked,
      memberIds: memberMatch.memberIds.join(","),
      memberLabels: memberMatch.memberLabels,
      primaryMemberId: memberMatch.primaryMemberId,
      memberMatchKinds: memberMatch.memberMatchKinds
    };

    features.push({ type: "Feature", id, geometry, properties: props });
    byCategory[category]++;
    if (berRelevant) berRelevantCount++;

    if (center && category !== "land") {
      dossier.push({
        id,
        name,
        category,
        subcategory,
        iconKey,
        iconGlyph: infraIconGlyph(iconKey),
        berScore,
        memberLabels: memberMatch.memberLabels,
        geomType: geomTypeOf(geometry),
        coordinates: center
      });
    }
  }

  const rankedLand = rankLandParcels(landParcels).slice(0, 60);
  const developableHa = rankedLand
    .filter((p) => p.opportunity === "developable" || p.opportunity === "pilot-anchor")
    .reduce((s, p) => s + p.areaHa, 0);

  dossier.sort((a, b) => b.berScore - a.berScore || a.name.localeCompare(b.name));
  const infrastructure = dossier.slice(0, 120);
  const iconGeojson = buildInfraIconGeoJSON(features);
  const memberLinkCounts = countMemberOsmLinks(features);
  const memberLinkedTotal = features.filter(
    (f) => (f.properties as OsmIntelFeatureProperties).memberLinked
  ).length;

  const substations = byCategory.power;
  const transport = byCategory.transport;
  const industry = byCategory.industry;

  return {
    geojson: { type: "FeatureCollection", features },
    iconGeojson,
    summary: {
      total: features.length,
      byCategory,
      berRelevantCount,
      topTargets: infrastructure.slice(0, 40),
      infrastructure,
      landParcels: rankedLand,
      developableHa: Math.round(developableHa * 10) / 10,
      infrastructureNote: `${regionLabel}: ${substations} power, ${transport} transport, ${industry} industry, ${iconGeojson.features.length} icons${memberLinkedTotal ? `, ${memberLinkedTotal} member-linked features` : ""}.`,
      memberLinkCounts,
      memberLinkedTotal
    },
    curatedSites,
    fetchedAt: new Date().toISOString(),
    bbox,
    attribution: "© OpenStreetMap contributors · Overpass API · indicative only (not cadastral)"
  };
}

export async function fetchOsmIntelForBbox(
  bbox: OsmBbox,
  regionLabel: string,
  opts?: { curatedSites?: BerLandSite[]; timeoutSec?: number }
): Promise<OsmIntelPayload> {
  const query = buildOverpassQuery(bbox, opts?.timeoutSec ?? 90);
  const body = "data=" + encodeURIComponent(query);
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": `BER-war-map/0.1 ${regionLabel} OSM (+https://www.ber-plus.de/)`
        },
        cache: "no-store",
        signal: AbortSignal.timeout(125_000)
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const data = (await res.json()) as { elements?: OsmElement[] };
      if (!data.elements?.length) throw new Error("Empty Overpass response");
      return osmElementsToIntel(data.elements, {
        bbox,
        regionLabel,
        curatedSites: opts?.curatedSites ?? []
      });
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("Overpass failed");
    }
  }

  throw lastError ?? new Error("Overpass unavailable");
}

export async function fetchSchoenefeldOsmIntel(): Promise<OsmIntelPayload> {
  return fetchOsmIntelForBbox(SCHOENEFELD_OSM_BBOX, "Schönefeld corridor", {
    curatedSites: BER_LAND_SITES,
    timeoutSec: 120
  });
}
