import { CATEGORY_COLORS, MITGLIEDER } from "@/data/mitglieder";
import { haversineKm, ringFromRadiusKm } from "@/lib/geo";
import { getMemberProfile } from "@/lib/member-osm-links";

const CORRIDOR_FOCUS: [number, number] = [13.52, 52.38];

export type MemberZoneProperties = {
  id: string;
  shortName: string;
  color: string;
  radiusKm: number;
  labelLng: number;
  labelLat: number;
  inCorridorSector: boolean;
};

function zoneRadiusKm(memberId: string, coordinates: [number, number]): number {
  const profile = getMemberProfile(memberId);
  if (profile?.proximityKm) return profile.proximityKm;
  return haversineKm(coordinates, CORRIDOR_FOCUS) < 9 ? 2.4 : 1.2;
}

function inCorridorSector([lng, lat]: [number, number]): boolean {
  return lng >= 13.4 && lng <= 13.65 && lat >= 52.3 && lat <= 52.43;
}

export function memberZonesToGeoJSON(): GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  MemberZoneProperties
> {
  return {
    type: "FeatureCollection",
    features: MITGLIEDER.map((m) => {
      const radiusKm = zoneRadiusKm(m.id, m.coordinates);
      const ring = ringFromRadiusKm(m.coordinates, radiusKm);
      return {
        type: "Feature",
        id: m.id,
        geometry: { type: "Polygon", coordinates: [ring] },
        properties: {
          id: m.id,
          shortName: m.shortName,
          color: CATEGORY_COLORS[m.category],
          radiusKm,
          labelLng: m.coordinates[0],
          labelLat: m.coordinates[1],
          inCorridorSector: inCorridorSector(m.coordinates)
        }
      };
    })
  };
}

export function memberZoneLabelsToGeoJSON(): GeoJSON.FeatureCollection<
  GeoJSON.Point,
  MemberZoneProperties
> {
  const zones = memberZonesToGeoJSON();
  return {
    type: "FeatureCollection",
    features: zones.features
      .filter((f) => f.properties!.inCorridorSector)
      .map((f) => ({
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
