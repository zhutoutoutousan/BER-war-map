import { BER_LAND_SITES } from "@/data/ber-land-sites";
import { haversineKm } from "@/lib/geo";
import { scoreBerRelevance } from "@/lib/ber-topics";

export type LandOpportunity = "pilot-anchor" | "developable" | "potential" | "expansion" | "occupied";

const DEVELOPABLE_LANDUSE = new Set([
  "greenfield",
  "brownfield",
  "construction",
  "meadow",
  "grass",
  "farmland",
  "orchard",
  "allotments",
  "vineyard"
]);

const OCCUPIED_LANDUSE = new Set(["industrial", "commercial", "retail", "logistics", "railway"]);

export function polygonAreaHa(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const ring = coords[0][0] === coords[coords.length - 1][0] ? coords : [...coords, coords[0]];
  let area = 0;
  const latMid = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((latMid * Math.PI) / 180);

  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[i + 1];
    const x1 = lng1 * mPerDegLng;
    const y1 = lat1 * mPerDegLat;
    const x2 = lng2 * mPerDegLng;
    const y2 = lat2 * mPerDegLat;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2) / 10_000;
}

export function classifyLandOpportunity(
  tags: Record<string, string>,
  areaHa: number,
  name: string,
  center: [number, number]
): { opportunity: LandOpportunity; suitability: number; notes: string } {
  const landuse = tags.landuse ?? "";
  const text = `${name} ${Object.values(tags).join(" ")}`;
  const berScore = scoreBerRelevance(text);

  const curated = matchCuratedLandSite(name, center);
  if (curated) {
    return {
      opportunity: "pilot-anchor",
      suitability: 95,
      notes: `BER+ anchor: ${curated.nameDe}`
    };
  }

  if (DEVELOPABLE_LANDUSE.has(landuse)) {
    const suitability =
      landuse === "greenfield" || landuse === "brownfield" || landuse === "construction"
        ? 85
        : areaHa >= 1
          ? 55
          : 35;
    return {
      opportunity: landuse === "brownfield" || landuse === "greenfield" ? "developable" : "potential",
      suitability: suitability + Math.min(berScore * 3, 15),
      notes:
        landuse === "farmland" || landuse === "meadow"
          ? "Open land — requires B-Plan / landscape review for BER+ use"
          : `OSM landuse=${landuse} — indicative only`
    };
  }

  if (OCCUPIED_LANDUSE.has(landuse)) {
    return {
      opportunity: areaHa >= 2 ? "expansion" : "occupied",
      suitability: 40 + Math.min(berScore * 4, 25),
      notes: "Developed gewerbe — BER+ model: rooftop PV, tenant load, not vacant plot"
    };
  }

  return {
    opportunity: "potential",
    suitability: 20,
    notes: "Review manually"
  };
}

export function matchCuratedLandSite(
  name: string,
  center: [number, number]
): (typeof BER_LAND_SITES)[number] | null {
  const hay = name.toLowerCase();
  for (const site of BER_LAND_SITES) {
    const tokens = site.id.split("-").filter((t) => t.length > 3);
    if (tokens.some((t) => hay.includes(t))) return site;
    if (haversineKm(center, site.coordinates) < 1.2) return site;
  }
  return null;
}

export function rankLandParcels<
  T extends { name: string; areaHa: number; suitability: number; opportunity: LandOpportunity; coordinates: [number, number] }
>(parcels: T[]): T[] {
  const order: Record<LandOpportunity, number> = {
    "pilot-anchor": 0,
    developable: 1,
    potential: 2,
    expansion: 3,
    occupied: 4
  };
  return [...parcels].sort(
    (a, b) =>
      order[a.opportunity] - order[b.opportunity] ||
      b.suitability - a.suitability ||
      b.areaHa - a.areaHa
  );
}
