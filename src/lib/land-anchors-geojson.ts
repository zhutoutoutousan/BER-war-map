import { BER_LAND_SITES, type BerLandSite } from "@/data/ber-land-sites";
import { LAND_SITE_MEMBER_IDS } from "@/lib/member-osm-links";
import { getMitgliedById } from "@/data/mitglieder";

export type LandAnchorProperties = {
  id: string;
  name: string;
  areaHa: number;
  status: string;
  useCase: string;
  labelLng: number;
  labelLat: number;
  memberIds: string;
  memberLabels: string;
};

function siteMemberLabels(siteId: string): string {
  const ids = LAND_SITE_MEMBER_IDS[siteId] ?? [];
  return ids
    .map((id) => getMitgliedById(id)?.shortName)
    .filter(Boolean)
    .join(" · ");
}

/** Categories drawn as area blocks only — no circle points on map */
export const POLYGON_ONLY_CATEGORIES = new Set(["land", "industry", "aeroway"]);

/** Approximate circular footprint from centre + hectares (indicative zone, not cadastral). */
function footprintRing(center: [number, number], areaHa: number, steps = 40): [number, number][] {
  const radiusM = Math.sqrt((areaHa * 10_000) / Math.PI);
  const lat = center[1];
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((lat * Math.PI) / 180);
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([
      center[0] + (radiusM * Math.cos(a)) / mPerDegLng,
      center[1] + (radiusM * Math.sin(a)) / mPerDegLat
    ]);
  }
  return ring;
}

function siteRing(site: BerLandSite): [number, number][] {
  if (site.footprint?.length) {
    const ring = [...site.footprint];
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
    return ring;
  }
  return footprintRing(site.coordinates, site.areaHa);
}

export function landAnchorsToGeoJSON(): GeoJSON.FeatureCollection<GeoJSON.Polygon, LandAnchorProperties> {
  return {
    type: "FeatureCollection",
    features: BER_LAND_SITES.map((site) => ({
      type: "Feature",
      id: site.id,
      geometry: {
        type: "Polygon",
        coordinates: [siteRing(site)]
      },
      properties: {
        id: site.id,
        name: site.nameDe,
        areaHa: site.areaHa,
        status: site.status,
        useCase: site.useCase,
        labelLng: site.coordinates[0],
        labelLat: site.coordinates[1],
        memberIds: (LAND_SITE_MEMBER_IDS[site.id] ?? []).join(","),
        memberLabels: siteMemberLabels(site.id)
      }
    }))
  };
}

/** Centroid points for labels only (not rendered as dots). */
export function landAnchorLabelsToGeoJSON(): GeoJSON.FeatureCollection<
  GeoJSON.Point,
  LandAnchorProperties
> {
  const zones = landAnchorsToGeoJSON();
  return {
    type: "FeatureCollection",
    features: zones.features.map((f) => ({
      type: "Feature",
      id: f.properties!.id,
      geometry: {
        type: "Point",
        coordinates: [f.properties!.labelLng, f.properties!.labelLat]
      },
      properties: f.properties!
    }))
  };
}
