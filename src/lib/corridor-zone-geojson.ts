import berCorridor from "@/data/ber-corridor.json";
import { bufferLineToPolygon } from "@/lib/geo";

const CORRIDOR_RIBBON_KM = 1.8;

export type CorridorZoneProperties = {
  id: string;
  name: string;
};

export function corridorZoneToGeoJSON(): GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  CorridorZoneProperties
> {
  const line = berCorridor.features.find(
    (f) => f.geometry?.type === "LineString" && f.properties?.id === "ber-corridor"
  );
  if (!line || line.geometry.type !== "LineString") {
    return { type: "FeatureCollection", features: [] };
  }

  const coords = line.geometry.coordinates as [number, number][];
  const ring = bufferLineToPolygon(coords, CORRIDOR_RIBBON_KM);
  if (!ring.length) return { type: "FeatureCollection", features: [] };

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "ber-corridor-zone",
        properties: {
          id: "ber-corridor-zone",
          name: (line.properties?.name as string) ?? "BER+ Corridor"
        },
        geometry: { type: "Polygon", coordinates: [ring] }
      }
    ]
  };
}

/** Midpoint of corridor line for badge label */
export function corridorMidpointLabel(): GeoJSON.FeatureCollection {
  const line = berCorridor.features.find(
    (f) => f.geometry?.type === "LineString" && f.properties?.id === "ber-corridor"
  );
  if (!line || line.geometry.type !== "LineString") {
    return { type: "FeatureCollection", features: [] };
  }
  const coords = line.geometry.coordinates as [number, number][];
  const mid = coords[Math.floor(coords.length / 2)] ?? coords[0];
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "BER+ Corridor" },
        geometry: { type: "Point", coordinates: mid }
      }
    ]
  };
}
